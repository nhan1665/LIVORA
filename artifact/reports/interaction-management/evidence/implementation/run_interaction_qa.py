import http.server
import socketserver
import threading
import time
import os
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

PORT = 4262
DIR = os.path.abspath('livora_admin/dist/livora_admin/browser')
OUT_DIR = os.path.abspath('artifact/reports/interaction-management/evidence/implementation')
EDGE_PATH = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_GET(self):
        full_path = self.translate_path(self.path)
        if not os.path.exists(full_path) or (
            os.path.isdir(full_path) and not os.path.exists(os.path.join(full_path, 'index.html'))
        ):
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, *args):
        pass


def start_server():
    server = socketserver.TCPServer(('127.0.0.1', PORT), SPAHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f'Starting local SPA server on http://127.0.0.1:{PORT}...')
    server = start_server()
    time.sleep(1)

    results = {
        'runAt': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'browser': 'Microsoft Edge (Playwright) — development build',
        'viewport': '1317x982 desktop, 390x844 mobile checks',
        'checks': [],
        'errors': [],
    }

    def record_check(name, passed, detail=''):
        results['checks'].append({'name': name, 'passed': passed, 'detail': detail})
        print(f"[{'PASS' if passed else 'FAIL'}] {name}: {detail}")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=EDGE_PATH, headless=True)
        context = browser.new_context(viewport={'width': 1317, 'height': 982})
        page = context.new_page()
        page.on('pageerror', lambda err: results['errors'].append(str(err)))

        # ---------------------------------------------------------------
        # 1. CONTACT PAGE — /interactions/contact
        # ---------------------------------------------------------------
        page.goto(f'http://127.0.0.1:{PORT}/interactions/contact')
        page.wait_for_selector('.contact-page', timeout=10000)
        time.sleep(0.4)

        title = page.locator('.page-title').inner_text()
        record_check('Contact page title', 'Quản lý liên hệ' in title, title)

        rows = page.locator('.contact-table tbody tr')
        record_check('Contact page 1 row count', rows.count() == 5, f'Rows: {rows.count()}')

        badge = page.locator('.count-badge').inner_text()
        record_check('Contact record badge', '48 bản ghi' in badge, badge)

        footer = page.locator('.pagination-info').inner_text()
        record_check('Contact footer total', '48' in footer and 'liên hệ tư vấn' in footer, footer)

        first_code = rows.first.locator('.code-badge').inner_text()
        record_check('Contact first row code', first_code.strip() == 'LH-2610-089', first_code)

        page.screenshot(path=os.path.join(OUT_DIR, 'contact-list-1317x982.png'), full_page=True)

        # Filter by status = resolved
        page.locator('.filter-select').first.select_option('resolved')
        page.locator('.btn-apply').click()
        time.sleep(0.4)
        statuses = page.locator('.contact-table tbody .status-pill').all_inner_texts()
        record_check(
            'Contact status filter (Đã xử lý)',
            len(statuses) > 0 and all('Đã xử lý' in s for s in statuses),
            f'{len(statuses)} rows checked',
        )

        # Reset
        page.locator('.btn-reset-label').click()
        time.sleep(0.4)
        record_check('Contact reset filter', page.locator('.contact-table tbody tr').count() == 5, 'Rows restored to 5')

        # Pagination
        page.locator('.page-number', has_text='2').first.click()
        time.sleep(0.4)
        active_page = page.locator('.page-number.active').inner_text()
        record_check('Contact pagination page 2', active_page.strip() == '2', active_page)
        page.locator('.page-number', has_text='1').first.click()
        time.sleep(0.4)

        # Detail modal
        rows = page.locator('.contact-table tbody tr')
        rows.first.locator('.btn-detail').click()
        page.wait_for_selector('.modal-dialog', timeout=5000)
        time.sleep(0.4)
        modal_title = page.locator('.modal-title').inner_text()
        record_check('Contact detail modal', 'Chi tiết liên hệ' in modal_title, modal_title)
        page.screenshot(path=os.path.join(OUT_DIR, 'contact-detail-1317x982.png'), full_page=False)
        page.locator('.modal-close-btn').click()
        time.sleep(0.3)

        # Resolve flow on first pending row
        rows = page.locator('.contact-table tbody tr')
        rows.first.locator('.btn-resolve').click()
        page.wait_for_selector('.confirm-dialog', timeout=5000)
        time.sleep(0.3)
        confirm_text = page.locator('.confirm-title').inner_text()
        record_check('Contact resolve confirmation shown', 'Duyệt xử lý' in confirm_text, confirm_text)
        page.locator('.btn-confirm').click()
        time.sleep(0.5)
        toast = page.locator('.im-toast').inner_text()
        record_check('Contact resolve toast', 'Đã xử lý' in toast, toast)
        first_status = page.locator('.contact-table tbody .status-pill').first.inner_text()
        record_check('Contact row resolved after action', 'Đã xử lý' in first_status, first_status)

        # ---------------------------------------------------------------
        # 2. REVIEW PAGE — /interactions/reviews
        # ---------------------------------------------------------------
        page.goto(f'http://127.0.0.1:{PORT}/interactions/reviews')
        page.wait_for_selector('.review-page', timeout=10000)
        time.sleep(0.4)

        title = page.locator('.page-title').inner_text()
        record_check('Review page title', 'Quản lý đánh giá' in title, title)

        rows = page.locator('.review-table tbody tr')
        record_check('Review page 1 row count', rows.count() == 5, f'Rows: {rows.count()}')

        footer = page.locator('.pagination-info').inner_text()
        record_check('Review footer total', '342' in footer and 'đánh giá khách hàng' in footer, footer)

        page.screenshot(path=os.path.join(OUT_DIR, 'review-list-1317x982.png'), full_page=True)

        # Filter 5 stars
        page.locator('.filter-select').first.select_option(label='5 sao')
        page.locator('.btn-apply').click()
        time.sleep(0.4)
        ratings = page.locator('.review-table tbody .rating-value').all_inner_texts()
        record_check(
            'Review star filter (5 sao)',
            len(ratings) > 0 and all('5/5 sao' in r for r in ratings),
            f'{len(ratings)} rows checked',
        )

        # Filter hidden
        page.locator('.filter-select').first.select_option(label='Tất cả số sao')
        page.locator('.filter-select').nth(1).select_option('hidden')
        page.locator('.btn-apply').click()
        time.sleep(0.4)
        hidden_statuses = page.locator('.review-table tbody .status-pill').all_inner_texts()
        record_check(
            'Review hidden filter',
            len(hidden_statuses) > 0 and all('Đã ẩn' in s for s in hidden_statuses),
            f'{len(hidden_statuses)} rows checked',
        )

        # Reset
        page.locator('.btn-reset-icon').click()
        time.sleep(0.4)
        record_check('Review reset filter', page.locator('.review-table tbody tr').count() == 5, 'Rows restored to 5')

        # Detail modal
        rows = page.locator('.review-table tbody tr')
        rows.first.locator('.icon-btn').first.click()
        page.wait_for_selector('.modal-dialog', timeout=5000)
        time.sleep(0.4)
        modal_title = page.locator('.modal-title').inner_text()
        record_check('Review detail modal', 'Chi tiết đánh giá' in modal_title, modal_title)
        page.screenshot(path=os.path.join(OUT_DIR, 'review-detail-1317x982.png'), full_page=False)
        page.locator('.modal-close-btn').click()
        time.sleep(0.3)

        # Hide flow on first visible row
        rows = page.locator('.review-table tbody tr')
        first_code = rows.first.locator('.code-badge').inner_text().strip()
        rows.first.locator('.icon-btn').nth(1).click()
        page.wait_for_selector('.modal-dialog', timeout=5000)
        time.sleep(0.3)
        page.locator('.field-textarea').fill('QA kiểm thử: nội dung không phù hợp quy định kiểm duyệt.')
        page.locator('.btn-submit').click()
        time.sleep(0.5)
        toast = page.locator('.im-toast').inner_text()
        record_check('Review hide toast', 'Đã ẩn đánh giá' in toast, toast)

        # ---------------------------------------------------------------
        # 3. VOUCHER PAGE — /settings/vouchers
        # ---------------------------------------------------------------
        page.goto(f'http://127.0.0.1:{PORT}/settings/vouchers')
        page.wait_for_selector('.voucher-page', timeout=10000)
        time.sleep(0.4)

        title = page.locator('.page-title').inner_text()
        record_check('Voucher page title', 'Thiết lập Voucher' in title, title)

        rows = page.locator('.voucher-table tbody tr')
        record_check('Voucher page 1 row count', rows.count() == 5, f'Rows: {rows.count()}')

        footer = page.locator('.pagination-info').inner_text()
        record_check('Voucher footer total', '36' in footer and 'voucher' in footer, footer)

        page.screenshot(path=os.path.join(OUT_DIR, 'voucher-list-1317x982.png'), full_page=True)

        # Create modal
        page.locator('.btn-primary-create').click()
        page.wait_for_selector('.modal-dialog', timeout=5000)
        time.sleep(0.4)
        modal_title = page.locator('.modal-title').inner_text()
        record_check('Voucher create modal', 'Thêm mới Voucher' in modal_title, modal_title)
        page.screenshot(path=os.path.join(OUT_DIR, 'voucher-create-1317x982.png'), full_page=False)

        page.locator('#voucherCodeInput').fill('QA-VOUCHER-01')
        page.locator('#voucherTitleInput').fill('Chương trình kiểm thử QA')
        page.locator('.btn-submit').click()
        time.sleep(0.6)
        toast = page.locator('.im-toast').inner_text()
        record_check('Voucher create toast', 'Đã tạo voucher' in toast, toast)
        footer_after = page.locator('.pagination-info').inner_text()
        record_check('Voucher total increased', '37' in footer_after, footer_after)

        # Toggle first row switch
        page.locator('.voucher-table tbody tr').first.locator('.toggle-switch').click()
        time.sleep(0.5)
        toast = page.locator('.im-toast').inner_text()
        record_check('Voucher toggle toast', 'voucher' in toast and ('kích hoạt' in toast or 'tạm tắt' in toast), toast)

        # ---------------------------------------------------------------
        # 4. SHIPPING PAGE — /settings/shipping
        # ---------------------------------------------------------------
        page.goto(f'http://127.0.0.1:{PORT}/settings/shipping')
        page.wait_for_selector('.shipping-page', timeout=10000)
        time.sleep(0.4)

        title = page.locator('.page-title').inner_text()
        record_check('Shipping page title', 'Thiết Lập Vận Chuyển' in title, title)

        rows = page.locator('.shipping-table tbody tr')
        record_check('Shipping page 1 row count', rows.count() == 6, f'Rows: {rows.count()}')

        footer = page.locator('.pagination-info').inner_text()
        record_check('Shipping footer total', '54' in footer and 'cấu hình vận chuyển' in footer, footer)

        page.screenshot(path=os.path.join(OUT_DIR, 'shipping-list-1317x982.png'), full_page=True)

        # Create modal
        page.locator('.btn-primary-create').click()
        page.wait_for_selector('.modal-dialog', timeout=5000)
        time.sleep(0.4)
        modal_title = page.locator('.modal-title').inner_text()
        record_check('Shipping create modal', 'Thêm mới Cấu hình vận chuyển' in modal_title, modal_title)
        page.screenshot(path=os.path.join(OUT_DIR, 'shipping-create-1317x982.png'), full_page=False)

        page.locator('.btn-submit').click()
        time.sleep(0.6)
        toast = page.locator('.im-toast').inner_text()
        record_check('Shipping create toast', 'Đã thêm cấu hình' in toast, toast)
        footer_after = page.locator('.pagination-info').inner_text()
        record_check('Shipping total increased', '55' in footer_after, footer_after)

        # Toggle first row switch
        page.locator('.shipping-table tbody tr').first.locator('.toggle-switch').click()
        time.sleep(0.5)
        toast = page.locator('.im-toast').inner_text()
        record_check(
            'Shipping toggle toast',
            'cấu hình vận chuyển' in toast and ('áp dụng' in toast or 'ngừng' in toast),
            toast,
        )

        # ---------------------------------------------------------------
        # 5. MOBILE CHECKS — 390x844
        # ---------------------------------------------------------------
        page.set_viewport_size({'width': 390, 'height': 844})

        page.goto(f'http://127.0.0.1:{PORT}/interactions/contact')
        page.wait_for_selector('.contact-page', timeout=10000)
        time.sleep(0.4)
        page.screenshot(path=os.path.join(OUT_DIR, 'contact-list-mobile-390x844.png'), full_page=True)

        page.goto(f'http://127.0.0.1:{PORT}/settings/vouchers')
        page.wait_for_selector('.voucher-page', timeout=10000)
        page.locator('.btn-primary-create').click()
        time.sleep(0.5)
        page.screenshot(path=os.path.join(OUT_DIR, 'voucher-create-mobile-390x844.png'), full_page=False)

        browser.close()

    server.shutdown()

    results_path = os.path.join(OUT_DIR, 'interaction-browser-interaction-results.json')
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'Results written to {results_path}')

    passed = sum(1 for c in results['checks'] if c['passed'])
    print(f"TOTAL: {passed}/{len(results['checks'])} checks passed, {len(results['errors'])} page errors")


if __name__ == '__main__':
    main()
