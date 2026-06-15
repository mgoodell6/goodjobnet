import sys
import ctypes
import threading
import time
import subprocess
import webbrowser
import traceback

is_windows = sys.platform.startswith("win")

# Global Call State
call_active = False
method_active = "google-voice"
_hook_id = None
_hook_thread = None
_hook_thread_id = None
_hook_lock = threading.Lock()

if is_windows:
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    # Setup ctypes signatures to prevent 64-bit handle truncation
    user32.IsWindowVisible.argtypes = [wintypes.HWND]
    user32.IsWindowVisible.restype = wintypes.BOOL

    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int

    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows.argtypes = [WNDENUMPROC, wintypes.LPARAM]
    user32.EnumWindows.restype = wintypes.BOOL

    user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    user32.PostMessageW.restype = wintypes.BOOL

    user32.IsWindow.argtypes = [wintypes.HWND]
    user32.IsWindow.restype = wintypes.BOOL

    user32.SetForegroundWindow.argtypes = [wintypes.HWND]
    user32.SetForegroundWindow.restype = wintypes.BOOL

    HOOKPROC = ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)

    user32.CallNextHookEx.argtypes = [wintypes.HHOOK, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM]
    user32.CallNextHookEx.restype = ctypes.c_longlong

    user32.SetWindowsHookExW.argtypes = [ctypes.c_int, HOOKPROC, wintypes.HMODULE, wintypes.DWORD]
    user32.SetWindowsHookExW.restype = wintypes.HHOOK

    user32.UnhookWindowsHookEx.argtypes = [wintypes.HHOOK]
    user32.UnhookWindowsHookEx.restype = wintypes.BOOL

    user32.PostThreadMessageW.argtypes = [wintypes.DWORD, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    user32.PostThreadMessageW.restype = wintypes.BOOL

    user32.GetMessageW.argtypes = [ctypes.POINTER(wintypes.MSG), wintypes.HWND, wintypes.UINT, wintypes.UINT]
    user32.GetMessageW.restype = wintypes.BOOL

    user32.TranslateMessage.argtypes = [ctypes.POINTER(wintypes.MSG)]
    user32.TranslateMessage.restype = wintypes.BOOL

    user32.DispatchMessageW.argtypes = [ctypes.POINTER(wintypes.MSG)]
    user32.DispatchMessageW.restype = wintypes.LPARAM

    kernel32.GetCurrentThreadId.argtypes = []
    kernel32.GetCurrentThreadId.restype = wintypes.DWORD

    kernel32.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
    kernel32.GetModuleHandleW.restype = wintypes.HMODULE

    WH_KEYBOARD_LL = 13
    WM_KEYDOWN = 0x0100
    WM_SYSKEYDOWN = 0x0104

    class KBDLLHOOKSTRUCT(ctypes.Structure):
        _fields_ = [
            ("vkCode", wintypes.DWORD),
            ("scanCode", wintypes.DWORD),
            ("flags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", ctypes.POINTER(wintypes.ULONG))
        ]

    def close_google_voice_window():
        try:
            found_hwnd = []
            
            def enum_windows_callback(hwnd, lParam):
                if user32.IsWindowVisible(hwnd):
                    length = user32.GetWindowTextLengthW(hwnd)
                    if length > 0:
                        buf = ctypes.create_unicode_buffer(length + 1)
                        user32.GetWindowTextW(hwnd, buf, length + 1)
                        title = buf.value
                        if "Google Voice" in title or title.startswith("Voice - "):
                            found_hwnd.append(hwnd)
                return True
                
            user32.EnumWindows(WNDENUMPROC(enum_windows_callback), 0)
            
            for hwnd in found_hwnd:
                print(f"[Local Hangup] Setting foreground window and sending WM_CLOSE to handle {hwnd}")
                user32.SetForegroundWindow(hwnd)
                time.sleep(0.2)
                user32.PostMessageW(hwnd, 0x0010, 0, 0) # WM_CLOSE = 0x0010
                
                # Wait for 0.4 seconds to see if window is closed or blocked by "Leave site?" prompt
                time.sleep(0.4)
                if user32.IsWindow(hwnd):
                    print(f"[Local Hangup] Window {hwnd} is still open. Sending ENTER key...")
                    user32.keybd_event(0x0D, 0, 0, 0) # Key press (VK_RETURN = 0x0D)
                    time.sleep(0.05)
                    user32.keybd_event(0x0D, 0, 2, 0) # Key release
                else:
                    print(f"[Local Hangup] Window {hwnd} closed successfully without prompt.")
                
            return len(found_hwnd) > 0
        except Exception as ex:
            print("[Local Hangup] Error closing Google Voice window:", str(ex))
            return False

    def do_global_hangup():
        global call_active
        print("[Global Hook] Intercepted user hangup key. Hanging up call...")
        call_active = False
        stop_global_key_listener()
        
        # Close Google Voice window
        close_google_voice_window()
        
        # Fallback: Find Phone Link window and close it
        try:
            ps_script = """
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*Phone Link*" } | Select-Object -First 1
            if ($proc) {
                $proc.CloseMainWindow()
            }
            """
            subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
        except Exception as ex:
            print("[Global Hook] Error executing Phone Link close fallback:", str(ex))

    def _keyboard_hook_proc(nCode, wParam, lParam):
        global _hook_id
        if nCode >= 0 and (wParam == WM_KEYDOWN or wParam == WM_SYSKEYDOWN):
            kbd = KBDLLHOOKSTRUCT.from_address(lParam)
            # Ignore simulated keypresses (flags bit 4 / 0x10 is LLKHF_INJECTED)
            is_injected = bool(kbd.flags & 0x10)
            if not is_injected:
                vk = kbd.vkCode
                # VK_ESCAPE = 0x1B, VK_RETURN = 0x0D, H/h = 0x48
                if vk in (0x1B, 0x0D, 0x48):
                    print(f"[Global Hook] Intercepted user hangup key: {hex(vk)}")
                    threading.Thread(target=do_global_hangup, daemon=True).start()
                
        return user32.CallNextHookEx(_hook_id, nCode, wParam, lParam)

    _hook_callback_ptr = HOOKPROC(_keyboard_hook_proc)

    def hook_message_loop():
        global _hook_id, _hook_thread_id
        _hook_thread_id = kernel32.GetCurrentThreadId()
        hmod = kernel32.GetModuleHandleW(None)
        _hook_id = user32.SetWindowsHookExW(
            WH_KEYBOARD_LL,
            _hook_callback_ptr,
            hmod,
            0
        )
        if not _hook_id:
            print(f"[Global Hook] Failed to set hook! Error code: {ctypes.GetLastError()}")
            return
            
        print("[Global Hook] Keyboard hook set successfully. Message loop starting...")
        msg = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) != 0:
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))
            
        print("[Global Hook] Message loop exited.")

    def start_global_key_listener():
        global _hook_thread, _hook_id
        with _hook_lock:
            if _hook_thread is not None:
                return
                
            _hook_thread = threading.Thread(target=hook_message_loop, daemon=True)
            _hook_thread.start()

    def stop_global_key_listener():
        global _hook_thread, _hook_id, _hook_thread_id
        with _hook_lock:
            if _hook_id:
                user32.UnhookWindowsHookEx(_hook_id)
                _hook_id = None
                if _hook_thread_id:
                    user32.PostThreadMessageW(_hook_thread_id, 0x0012, 0, 0) # WM_QUIT = 0x0012
            _hook_thread = None
            _hook_thread_id = None
            print("[Global Hook] Keyboard hook stopped.")

    def is_call_window_open(method):
        found = []
        
        def enum_windows_callback(hwnd, lParam):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buf = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buf, length + 1)
                    title = buf.value
                    if method == "phone-link":
                        if "Phone Link" in title:
                            found.append(hwnd)
                    else:
                        if "Google Voice" in title or title.startswith("Voice - "):
                            found.append(hwnd)
            return True
            
        user32.EnumWindows(WNDENUMPROC(enum_windows_callback), 0)
        return len(found) > 0

else:
    # Fallback placeholders for non-Windows platforms
    def close_google_voice_window():
        return False

    def do_global_hangup():
        pass

    def start_global_key_listener():
        pass

    def stop_global_key_listener():
        pass

    def is_call_window_open(method):
        return False

# Monitor window status
def monitor_call_status():
    global call_active, method_active
    print("[Monitor] Window monitoring thread running.")
    while True:
        time.sleep(1.0)
        if call_active:
            if not is_call_window_open(method_active):
                time.sleep(1.5)  # Wait a short moment and check again to ensure it's not a reload
                if not is_call_window_open(method_active):
                    print(f"[Monitor] Window for '{method_active}' is closed. Ending call state.")
                    call_active = False
                    stop_global_key_listener()

threading.Thread(target=monitor_call_status, daemon=True).start()

# Core logic handlers
def handle_dial_local(phone, method):
    global call_active, method_active
    print(f"[Local Helper] Dial requested for: {phone} using method: {method}")
    
    clean_phone = "".join(c for c in phone if c.isdigit())
    if len(clean_phone) == 10:
        clean_phone = "1" + clean_phone
        
    if not clean_phone:
        return False, False, "Invalid phone number"
        
    try:
        call_active = True
        method_active = method
        
        if not is_windows:
            return True, False, "Simulated call on non-Windows platform (no actions taken)"
            
        if method == "google-voice" or method == "google-voice-keypress-only":
            url = f"https://voice.google.com/calls?a=nc,%2B{clean_phone}"
            
            opened = False
            if is_windows:
                import winreg
                # Try Chrome
                chrome_path = None
                for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
                    try:
                        key = winreg.OpenKey(root, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe")
                        chrome_path, _ = winreg.QueryValueEx(key, "")
                        winreg.CloseKey(key)
                        break
                    except:
                        pass
                
                if chrome_path:
                    try:
                        print(f"[Local Helper] Launching Chrome in new window from: {chrome_path}")
                        subprocess.Popen([chrome_path, "--new-window", url])
                        opened = True
                    except Exception as ex:
                        print(f"[Local Helper] Error starting Chrome: {ex}")
                
                # If Chrome not found/failed, try Edge
                if not opened:
                    edge_path = None
                    try:
                        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe")
                        edge_path, _ = winreg.QueryValueEx(key, "")
                        winreg.CloseKey(key)
                    except:
                        pass
                    if edge_path:
                        try:
                            print(f"[Local Helper] Launching Edge in new window from: {edge_path}")
                            subprocess.Popen([edge_path, "--new-window", url])
                            opened = True
                        except Exception as ex:
                            print(f"[Local Helper] Error starting Edge: {ex}")
            
            if not opened:
                print("[Local Helper] Falling back to default webbrowser.open_new")
                webbrowser.open_new(url)
            
            # Wait for browser to open and load the tab
            time.sleep(2.5)
            
            # Send Enter key to make call
            ps_cmd = '[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")'
            subprocess.run(["powershell", "-Command", f"Add-Type -AssemblyName System.Windows.Forms; {ps_cmd}"], capture_output=True)
            
        elif method == "phone-link":
            subprocess.run(["cmd.exe", "/c", f"start tel:{clean_phone}"], shell=True)
            time.sleep(2.0)
            
            # Search for Phone Link window and trigger Call button
            ps_script = """
            Add-Type -AssemblyName UIAutomationClient
            Add-Type -AssemblyName UIAutomationTypes
            
            $root = [Windows.Automation.AutomationElement]::RootElement
            $condition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::NameProperty, "Phone Link")
            $window = $root.FindFirst([Windows.Automation.TreeScope]::Children, $condition)
            
            if (-not $window) {
                $procs = Get-Process -Name "PhoneExperienceHost" -ErrorAction SilentlyContinue
                if ($procs) {
                    $condition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, $procs[0].Id)
                    $window = $root.FindFirst([Windows.Automation.TreeScope]::Children, $condition)
                }
            }
            
            if ($window) {
                $button = $null
                for ($retry = 0; $retry -lt 8; $retry++) {
                    $elements = $window.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
                    foreach ($el in $elements) {
                        if ($el.Current.ClassName -eq "Button") {
                            $name = $el.Current.Name
                            $autoId = $el.Current.AutomationId
                            if (($name -like "*Call*") -or ($name -like "*Dial*") -or ($autoId -like "*Call*") -or ($autoId -like "*Dial*")) {
                                $button = $el
                                break
                            }
                        }
                    }
                    if ($button) { break }
                    Start-Sleep -Milliseconds 500
                }
                
                if ($button) {
                    $button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
                } else {
                    Add-Type -AssemblyName System.Windows.Forms
                    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                }
            } else {
                Add-Type -AssemblyName System.Windows.Forms
                [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            }
            """
            subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
            
        # Start global key listener
        threading.Timer(0.5, start_global_key_listener).start()
        return True, True, f"Dialed {clean_phone} using {method}"
        
    except Exception as e:
        print("[Local Helper] Dialing error:")
        traceback.print_exc()
        return False, False, str(e)

def handle_hangup_local():
    global call_active
    print("[Local Helper] Hangup requested")
    try:
        call_active = False
        
        if not is_windows:
            return True, "Hangup simulated on non-Windows", False
            
        stop_global_key_listener()
        closed_gv = close_google_voice_window()
        
        # Phone Link close fallback
        ps_script = """
        $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*Phone Link*" } | Select-Object -First 1
        if ($proc) {
            $proc.CloseMainWindow()
        }
        """
        subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
        return True, "Hangup executed", closed_gv
    except Exception as e:
        print("[Local Helper] Hangup error:")
        traceback.print_exc()
        return False, str(e), False

# Choose server framework
try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    USE_FLASK = True
except ImportError:
    USE_FLASK = False
    import http.server
    import json
    import urllib.parse

if USE_FLASK:
    app = Flask(__name__)
    CORS(app)

    @app.route('/api/dial', methods=['POST'])
    def dial():
        data = request.json or {}
        phone = data.get("phone", "")
        method = data.get("method", "google-voice")
        success, hook_active, msg = handle_dial_local(phone, method)
        return jsonify({"success": success, "hook_active": hook_active, "message": msg})

    @app.route('/api/hangup', methods=['POST'])
    def hangup():
        success, msg, closed_gv = handle_hangup_local()
        return jsonify({"success": success, "message": msg, "closed_gv": closed_gv})

    @app.route('/api/call-status', methods=['GET'])
    def call_status():
        global call_active
        return jsonify({"active": call_active})

    def run_server():
        print("Starting local helper using Flask on http://127.0.0.1:5001")
        app.run(host='127.0.0.1', port=5001, debug=False, threaded=True)

else:
    class LocalHelperHandler(http.server.BaseHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()

        def do_OPTIONS(self):
            self.send_response(200)
            self.end_headers()

        def do_GET(self):
            if self.path == '/api/call-status':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"active": call_active}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            if self.path == '/api/dial':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                except:
                    data = {}
                phone = data.get("phone", "")
                method = data.get("method", "google-voice")
                success, hook_active, msg = handle_dial_local(phone, method)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": success, "hook_active": hook_active, "message": msg}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            elif self.path == '/api/hangup':
                success, msg, closed_gv = handle_hangup_local()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": success, "message": msg, "closed_gv": closed_gv}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format, *args):
            # Suppress normal request log spam
            pass

    def run_server():
        server_address = ('127.0.0.1', 5001)
        httpd = http.server.HTTPServer(server_address, LocalHelperHandler)
        print("Flask/Flask-CORS not detected. Starting local helper using built-in http.server on http://127.0.0.1:5001")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == "__main__":
    run_server()
