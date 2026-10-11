import http.server
import socketserver
import threading
import time
import os
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

PORT = 4250
DIR = os.path.abspath('livora_admin/dist/livora_admin/browser')
OUT_DIR = os.path.abspath('artifact/reports/customer-management/evidence/implementation')
EDGE_PATH = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_GET(self):
        full_path = self.translate_path(self.path)
        if not os.path.exists(full_path) or (os.path.isdir(full_path) and not os.path.exists(os.path.join(full_path, 'index.html'))):
            self.path = '/index.html'
        return super().do_GET()

def start_server():
    server = socketserver.TCPServer(('127.0.0.1', PORT), SPAHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    return server

def annotate_image(image_path, out_path, annotations):
    """
    Draw numbered circles on image at given coordinates [(num, x, y), ...]
    """
    img = Image.open(image_path).convert('RGBA')
    draw = ImageDraw.Draw(img)

    for num, x, y in annotations:
        r = 14
        # Draw dark circle
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(89, 60, 59, 230), outline=(255, 255, 255, 255), width=2)
        # Draw number text
        draw.text((x - 4, y - 7), str(num), fill=(255, 255, 255, 255))

    img.convert('RGB').save(out_path)

def main():
    print(f'Starting local SPA server on http://127.0.0.1:{PORT}...')
    server = start_server()
    time.sleep(1)

    results = {
        'runAt': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'browser': 'Microsoft Edge (Playwright)',
        'checks': [],
        'errors': []
    }

    def record_check(name, passed, detail=''):
        results['checks'].append({'name': name, 'passed': passed, 'detail': detail})
        status = 'PASS' if passed else 'FAIL'
        print(f'[{status}] {name}: {detail}')

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=EDGE_PATH, headless=True)
        context = browser.new_context(viewport={'width': 1317, 'height': 982})
        page = context.new_page()

        page.on('pageerror', lambda err: results['errors'].append(str(err)))

        url = f'http://127.0.0.1:{PORT}/customers/list'
        print(f'Navigating to {url}...')
        page.goto(url)
        page.wait_for_selector('.customer-page-container', timeout=10000)

        # 1. Header & Title
        title_text = page.locator('.page-title').inner_text()
        record_check('Page Title Rendered', 'Danh sách khách hàng' in title_text, title_text)

        # 2. Metric Cards
        metrics = page.locator('.metric-value').all_inner_texts()
        record_check('Total Customers Metric', metrics[0] == '125', f'Value: {metrics[0]}')
        record_check('Registered Metric', metrics[1] == '94', f'Value: {metrics[1]}')
        record_check('Guest Metric', metrics[2] == '31', f'Value: {metrics[2]}')
        record_check('Active This Month Metric', metrics[3] == '118', f'Value: {metrics[3]}')

        # 3. Table Initial Render
        rows = page.locator('.customer-row')
        row_count = rows.count()
        record_check('Page 1 Row Count', row_count == 10, f'Rows: {row_count}')

        first_name = rows.first.locator('.customer-name').inner_text()
        record_check('First Customer Name', first_name == 'KTS. Hoàng Nam', first_name)

        # Screenshot Desktop List
        list_shot = os.path.join(OUT_DIR, 'customer-list-1317x982.png')
        page.screenshot(path=list_shot, full_page=True)
        print(f'Saved desktop list screenshot to {list_shot}')

        # 4. Search Filter
        search_input = page.locator('#customerSearchInput')
        search_input.fill('Hoàng Nam')
        page.locator('.btn-filter').click()
        time.sleep(0.3)
        filtered_count = page.locator('.customer-row').count()
        record_check('Search by Name', filtered_count == 1, f'Rows found: {filtered_count}')

        # 5. Reset Filter
        page.locator('.btn-reset').click()
        time.sleep(0.3)
        reset_count = page.locator('.customer-row').count()
        record_check('Reset Filter Restores Rows', reset_count == 10, f'Rows after reset: {reset_count}')

        # 6. Filter by Customer Type: Guest
        page.locator('#customerTypeSelect').select_option('guest')
        page.locator('.btn-filter').click()
        time.sleep(0.3)
        guest_count = page.locator('.customer-row').count()
        badge_text = page.locator('.count-badge').inner_text()
        record_check('Filter Guest Type', '31' in badge_text, badge_text)

        # 7. Filter by Status: Inactive
        page.locator('#customerTypeSelect').select_option('all')
        page.locator('#customerStatusSelect').select_option('inactive')
        page.locator('.btn-filter').click()
        time.sleep(0.3)
        badge_text_inactive = page.locator('.count-badge').inner_text()
        record_check('Filter Inactive Status', '7' in badge_text_inactive, badge_text_inactive)

        # Reset again
        page.locator('.btn-reset').click()
        time.sleep(0.3)

        # 8. Pagination
        page.locator('.page-btn:has-text("2")').click()
        time.sleep(0.3)
        page_indicator = page.locator('.page-indicator').inner_text()
        record_check('Navigate to Page 2', 'Trang 2/13' in page_indicator, page_indicator)

        page.locator('.page-btn:has-text("1")').first.click()
        time.sleep(0.3)

        # 9. Open Detail Modal for KTS. Hoàng Nam
        page.locator('.customer-row').first.locator('button:has-text("Xem")').click()
        page.wait_for_selector('.customer-modal-dialog', timeout=5000)
        time.sleep(0.5)

        modal_title = page.locator('.modal-profile-name').inner_text()
        record_check('Modal Profile Name', 'KTS. Hoàng Nam' in modal_title, modal_title)

        code_badge = page.locator('.badge-code').inner_text()
        record_check('Customer Code Badge', '#270926-001' in code_badge, code_badge)

        # Check section 1 values
        code_val = page.locator('.code-value').inner_text()
        email_val = page.locator('.email-value').inner_text()
        record_check('Customer Code in Info Box', code_val == '270926-001', code_val)
        record_check('Customer Email in Info Box', email_val == 'hoangnam.arch@gmail.com', email_val)

        # Check section 2 address cards
        addr_cards = page.locator('.address-item-card')
        addr_count = addr_cards.count()
        record_check('Address Cards Count', addr_count >= 2, f'Addresses: {addr_count}')

        # Check section 3 orders
        orders_rows = page.locator('.mini-orders-table tbody tr')
        orders_count = orders_rows.count()
        total_order_val = page.locator('.total-order-badge').inner_text()
        record_check('Orders Count in Mini Table', orders_count == 4, f'Orders: {orders_count}')
        record_check('Total Order Value', '457.500.000' in total_order_val, total_order_val)

        # Screenshot Desktop Detail Modal
        detail_shot = os.path.join(OUT_DIR, 'customer-detail-1317x982.png')
        page.screenshot(path=detail_shot, full_page=False)
        print(f'Saved desktop detail screenshot to {detail_shot}')

        # 10. Switch to Orders Tab
        page.locator('.modal-tab-btn:has-text("Lịch sử đơn hàng")').click()
        time.sleep(0.3)
        tab_orders_count = page.locator('.full-orders-wrap table tbody tr').count()
        record_check('Full Orders Tab Active', tab_orders_count == 4, f'Orders in tab: {tab_orders_count}')

        orders_tab_shot = os.path.join(OUT_DIR, 'customer-orders-tab-1317x982.png')
        page.screenshot(path=orders_tab_shot, full_page=False)

        # Switch back to Detail Tab
        page.locator('.modal-tab-btn:has-text("Chi tiết khách hàng")').click()
        time.sleep(0.3)

        # 11. Test Edit Mode
        page.locator('.btn-modal-edit').click()
        time.sleep(0.3)
        record_check('Edit Mode Input Visible', page.locator('#editFullName').is_visible(), 'Edit form rendered')

        # Edit and save
        page.locator('#editTierSubtitle').fill('HỒ SƠ ĐỊNH DANH MAISON ATELIER VIP - KIỂM THỬ THÀNH CÔNG')
        page.locator('.btn-modal-submit').click()
        time.sleep(0.5)
        toast_text = page.locator('.toast-alert').inner_text()
        record_check('Save Edit Toast', 'thành công' in toast_text, toast_text)

        # 12. Test Set Default Address
        page.locator('.btn-set-default').first.click()
        time.sleep(0.4)
        record_check('Default Address Checkmark Present', page.locator('.default-check-icon').count() > 0, 'Address default updated')

        # Close modal
        page.locator('.btn-modal-close').click()
        time.sleep(0.3)

        # 13. Mobile Viewport Check (390 x 844)
        page.set_viewport_size({'width': 390, 'height': 844})
        time.sleep(0.5)

        mobile_list_shot = os.path.join(OUT_DIR, 'customer-list-mobile-390x844.png')
        page.screenshot(path=mobile_list_shot, full_page=True)
        print(f'Saved mobile list screenshot to {mobile_list_shot}')

        # Open detail modal on mobile
        page.locator('.customer-row').first.locator('button:has-text("Xem")').click()
        time.sleep(0.5)

        mobile_detail_shot = os.path.join(OUT_DIR, 'customer-detail-mobile-390x844.png')
        page.screenshot(path=mobile_detail_shot, full_page=False)
        print(f'Saved mobile detail screenshot to {mobile_detail_shot}')

        browser.close()

    server.shutdown()

    # Save results json
    results_path = os.path.join(OUT_DIR, 'customer-browser-interaction-results.json')
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'Results written to {results_path}')

    # Create annotated images
    # 1. Desktop List
    annotate_image(
        list_shot,
        os.path.join(OUT_DIR, 'customer-list-1317x982-annotated.png'),
        [
            (1, 320, 95),   # Title
            (2, 400, 160),  # Metric cards
            (3, 400, 270),  # Filter bar
            (4, 400, 390),  # Table header & count
            (5, 1180, 460), # Action buttons
            (6, 1150, 915), # Pagination
        ]
    )

    # 2. Desktop Detail Modal
    annotate_image(
        detail_shot,
        os.path.join(OUT_DIR, 'customer-detail-1317x982-annotated.png'),
        [
            (1, 350, 95),   # Profile avatar and name
            (2, 350, 160),  # Tabs
            (3, 350, 240),  # Section 1 Info
            (4, 350, 520),  # Section 2 Addresses
            (5, 350, 780),  # Section 3 Orders
            (6, 920, 890),  # Footer buttons
        ]
    )

    print('Annotated images created successfully!')

if __name__ == '__main__':
    main()
