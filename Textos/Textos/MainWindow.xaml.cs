using System.Windows;
using Textos.ViewModels;

namespace Textos
{
    public partial class MainWindow : Window
    {
        private EditorViewModel _viewModel;

        public MainWindow()
        {
            InitializeComponent();
            _viewModel = new EditorViewModel();
            DataContext = _viewModel;
            
            // Update maximize button icon when window state changes
            StateChanged += MainWindow_StateChanged;
        }

        private void MainWindow_StateChanged(object? sender, EventArgs e)
        {
            // Update maximize/restore icon based on window state
            if (MaximizeIcon != null)
            {
                if (WindowState == WindowState.Maximized)
                {
                    // Restore icon (two overlapping rectangles)
                    MaximizeIcon.Data = System.Windows.Media.Geometry.Parse("M0,3 L7,3 L7,10 L0,10 Z M3,0 L10,0 L10,7 L7,7 M3,3 L3,0");
                    MaximizeButton.ToolTip = "Restore";
                }
                else
                {
                    // Maximize icon (single rectangle)
                    MaximizeIcon.Data = System.Windows.Media.Geometry.Parse("M0,0 L10,0 L10,10 L0,10 Z");
                    MaximizeButton.ToolTip = "Maximize";
                }
            }
        }

        private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        private void MaximizeButton_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState == WindowState.Maximized 
                ? WindowState.Normal 
                : WindowState.Maximized;
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}