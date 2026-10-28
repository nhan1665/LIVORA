"""Run Sprint 2 browser QA against disposable local fixtures only."""
import json
from datetime import datetime, timedelta
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent / 'browser'
OUT.mkdir(parents=True, exist_ok=True)
CREDS = json.loads((ROOT / '.venv/qa-credentials.json').read_text())
results = []

def record(name, action):
    try:
        detail = action()
        results.append({'name': name, 'passed': True, 'detail': str(detail or '')})
        print('PASS', name, detail or '', flush=True)
    except Exception as exc:
        results.append({'name': name, 'passed': False, 'detail': str(exc)[:500]})
        print('FAIL', name, str(exc)[:500], flush=True)
        raise

def shot(page, name, locators):
    raw = OUT / f'{name}.png'
    page.screenshot(path=str(raw), full_page=True)
    img = Image.open(raw).convert('RGB')
    draw = ImageDraw.Draw(img)
    notes = []
    for number, (label, selector) in enumerate(locators, 1):
        match = page.locator(selector).first
        if not match.count():
            continue
        box = match.bounding_box()
        if not box:
            continue
        x = max(22, int(box['x'] + min(box['width']/2, 120)))
        y = max(22, int(box['y'] + min(box['height']/2, 30)))
        draw.ellipse((x-16,y-16,x+16,y+16), fill='#593c3b', outline='white', width=2)
        draw.text((x-4,y-7), str(number), fill='white')
        notes.append(f'{number}: {label}')
    img.save(OUT / f'{name}-annotated.png')
    (OUT / f'{name}-annotations.txt').write_text('\n'.join(notes), encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', headless=True)
    admin = browser.new_page(viewport={'width': 1440, 'height': 900})
    customer = browser.new_page(viewport={'width': 1440, 'height': 900})
    admin.set_default_timeout(12000)
    customer.set_default_timeout(12000)
    voucher_code = 'S2QA' + datetime.now().strftime('%H%M%S')

    try:
        def admin_login():
            admin.goto('http://127.0.0.1:4201/login')
            admin.locator('#employeeCode').fill(CREDS['admin']['code'])
            admin.locator('#password').fill(CREDS['admin']['password'])
            admin.locator('button[type=submit]').first.click()
            admin.wait_for_function("!!localStorage.getItem('livora_admin_token')")
            return admin.url
        record('Admin real login', admin_login)

        def make_voucher():
            admin.goto('http://127.0.0.1:4201/settings/vouchers')
            admin.get_by_text('Thêm voucher', exact=True).click()
            admin.locator('#voucherCodeInput').fill(voucher_code)
            admin.locator('#voucherTitleInput').fill('Sprint 2 QA Voucher')
            admin.locator('#discountValueInput').fill('10')
            admin.locator('#minOrderInput').fill('1000000')
            admin.locator('#quantityInput').fill('5')
            admin.locator('#perCustomerInput').fill('1')
            admin.locator('#startDateInput').fill((datetime.now()-timedelta(days=1)).strftime('%Y-%m-%dT%H:%M'))
            admin.locator('#endDateInput').fill((datetime.now()+timedelta(days=2)).strftime('%Y-%m-%dT%H:%M'))
            shot(admin, 'voucher-create', [('Voucher code', '#voucherCodeInput'), ('Discount', '#discountValueInput'), ('Validity', '#endDateInput')])
            admin.locator('.btn-submit').click()
            admin.get_by_text(voucher_code, exact=False).first.wait_for()
            shot(admin, 'voucher-list', [('Saved voucher', f'text={voucher_code}')])
            return voucher_code
        record('Admin creates persistent voucher', make_voucher)

        def make_shipping():
            admin.goto('http://127.0.0.1:4201/settings/shipping')
            admin.get_by_text('Thêm cấu hình', exact=True).click()
            admin.locator('#provinceSelect').select_option(label='Hà Nội')
            admin.locator('#feeInput').fill('50000')
            admin.locator('#etaInput').fill('2 - 4 ngày')
            shot(admin, 'shipping-create', [('Region', '#provinceSelect'), ('VND fee', '#feeInput'), ('ETA', '#etaInput')])
            admin.locator('.btn-submit').click()
            admin.get_by_text('Hà Nội', exact=False).first.wait_for()
            shot(admin, 'shipping-list', [('Saved shipping region', 'text=Hà Nội')])
            return 'Hà Nội'
        record('Admin creates persistent shipping configuration', make_shipping)

        def customer_login():
            customer.goto('http://127.0.0.1:4200/login')
            customer.locator('input[name=username]').fill(CREDS['customer']['email'])
            customer.locator('input[name=password]').fill(CREDS['customer']['password'])
            customer.get_by_role('button', name='Đăng nhập', exact=True).click()
            customer.wait_for_function("!!localStorage.getItem('livora_customer_token')")
            return customer.url
        record('Customer real login', customer_login)

        def update_profile():
            customer.goto('http://127.0.0.1:4200/profile')
            customer.get_by_role('button', name='Chỉnh sửa').first.click()
            customer.locator('input[name=profileFullName]').fill('Sprint Two Updated Customer')
            customer.get_by_role('button', name='Lưu', exact=True).first.click()
            customer.get_by_text('Sprint Two Updated Customer').first.wait_for()
            customer.reload()
            customer.locator('input[name=profileFullName]').wait_for()
            assert customer.locator('input[name=profileFullName]').input_value() == 'Sprint Two Updated Customer'
            shot(customer, 'customer-profile', [('Saved name', 'input[name=profileFullName]'), ('Phone', 'input[name=profilePhone]')])
            return 'saved and reloaded'
        record('Customer profile persists across reload', update_profile)

        def admin_sees_profile():
            admin.goto('http://127.0.0.1:4201/customers/list')
            admin.get_by_text('Sprint Two Updated Customer').first.wait_for()
            shot(admin, 'admin-customers', [('Updated customer', 'text=Sprint Two Updated Customer')])
            admin.get_by_title('Xem chi tiết khách hàng').first.click()
            admin.get_by_text('Sprint Two Updated Customer').last.wait_for()
            shot(admin, 'admin-customer-detail', [('Canonical profile', '.modal-profile-name'), ('Phone', '.modal-body-content')])
            return 'Admin sees updated persisted name'
        record('Admin revalidates same customer profile', admin_sees_profile)

        def checkout():
            customer.evaluate("(p) => localStorage.setItem('livora_cart', JSON.stringify([{id:p,name:'Sprint Two Table',description:'QA product',price:2800000,quantity:1,image:'/images/categories/kitchen/dining-tables.png',productId:p}]))", CREDS['productId'])
            customer.goto('http://127.0.0.1:4200/payment')
            customer.locator('#fullName').fill('Sprint Two Updated Customer')
            customer.locator('#email').fill(CREDS['customer']['email'])
            customer.locator('#phone').fill(CREDS['customer']['phone'])
            customer.locator('input[name=province]').fill('Hà Nội')
            customer.locator('input[name=province]').dispatch_event('change')
            customer.locator('#address').fill('123 Test Street')
            customer.locator('input[name=shippingMethod]').first.wait_for()
            customer.locator('input[name=shippingMethod]').first.check()
            customer.locator('.checkout-promo-input').fill(voucher_code)
            customer.locator('.btn-use-promo').click()
            customer.locator('.checkout-promo-msg').wait_for()
            assert 'thành công' in customer.locator('.checkout-promo-msg').inner_text().lower(), customer.locator('.checkout-promo-msg').inner_text()
            shot(customer, 'customer-checkout', [('Shipping method', '.option-card'), ('Voucher', '.checkout-promo-box'), ('Server total', '.calc-rows-container')])
            customer.locator('.btn-complete-order').click()
            customer.get_by_text('Đặt hàng thành công!').wait_for()
            code = customer.locator('.detail-value.text-gold').first.inner_text()
            shot(customer, 'customer-order', [('Order code', '.detail-value.text-gold'), ('Confirmed total', '.total-price')])
            return code
        order_code = None
        try:
            order_code = checkout()
            results.append({'name':'Combined voucher and shipping checkout','passed':True,'detail':order_code})
            print('PASS Combined voucher and shipping checkout', order_code, flush=True)
        except Exception as exc:
            results.append({'name':'Combined voucher and shipping checkout','passed':False,'detail':str(exc)[:500]})
            print('FAIL Combined voucher and shipping checkout',str(exc)[:500],flush=True)
            raise

        def admin_order():
            admin.goto('http://127.0.0.1:4201/orders/list')
            admin.get_by_text(order_code).first.wait_for()
            shot(admin, 'admin-orders', [('Persisted order', f'text={order_code}')])
            return order_code
        record('Admin sees persisted order', admin_order)
    finally:
        (OUT.parent / 'browser-results.json').write_text(json.dumps({'checks':results}, ensure_ascii=False, indent=2), encoding='utf-8')
        browser.close()
