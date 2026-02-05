using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace Textos.Helpers
{
    public static class WindowHelper
    {
        [DllImport("dwmapi.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
        private static extern void DwmSetWindowAttribute(IntPtr hwnd, DWMWINDOWATTRIBUTE attribute, ref int pvAttribute, uint cbAttribute);

        private enum DWMWINDOWATTRIBUTE
        {
            DWMWA_WINDOW_CORNER_PREFERENCE = 33
        }

        private enum DWM_WINDOW_CORNER_PREFERENCE
        {
            DWMWCP_DEFAULT = 0,
            DWMWCP_DONOTROUND = 1,
            DWMWCP_ROUND = 2,
            DWMWCP_ROUNDSMALL = 3
        }

        /// <summary>
        /// Applies Windows 11 rounded corners to the window
        /// </summary>
        public static void ApplyRoundedCorners(Window window)
        {
            // Only works on Windows 11 (build 22000+)
            if (!IsWindows11OrNewer())
                return;

            var hwnd = new WindowInteropHelper(window).Handle;
            if (hwnd == IntPtr.Zero)
                return;

            var preference = (int)DWM_WINDOW_CORNER_PREFERENCE.DWMWCP_ROUND;
            try
            {
                DwmSetWindowAttribute(hwnd, DWMWINDOWATTRIBUTE.DWMWA_WINDOW_CORNER_PREFERENCE, ref preference, sizeof(int));
            }
            catch
            {
                // Ignore errors on older Windows versions
            }
        }

        /// <summary>
        /// Applies small rounded corners (for secondary windows/dialogs)
        /// </summary>
        public static void ApplySmallRoundedCorners(Window window)
        {
            if (!IsWindows11OrNewer())
                return;

            var hwnd = new WindowInteropHelper(window).Handle;
            if (hwnd == IntPtr.Zero)
                return;

            var preference = (int)DWM_WINDOW_CORNER_PREFERENCE.DWMWCP_ROUNDSMALL;
            try
            {
                DwmSetWindowAttribute(hwnd, DWMWINDOWATTRIBUTE.DWMWA_WINDOW_CORNER_PREFERENCE, ref preference, sizeof(int));
            }
            catch
            {
                // Ignore errors on older Windows versions
            }
        }

        private static bool IsWindows11OrNewer()
        {
            return Environment.OSVersion.Version.Build >= 22000;
        }
    }
}
