using System.Windows;
using System.Windows.Media;
using Textos.Helpers;
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
            
            // Save settings when window is closing
            Closing += MainWindow_Closing;
            
            // Apply Windows 11 rounded corners
            SourceInitialized += MainWindow_SourceInitialized;
        }

        private void MainWindow_SourceInitialized(object? sender, EventArgs e)
        {
            WindowHelper.ApplyRoundedCorners(this);
        }

        private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
        {
            _viewModel.SaveSettings();
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

        private void Header_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            // Don't handle if the click originated from a button or interactive control
            if (e.OriginalSource is DependencyObject source)
            {
                var parent = source;
                while (parent != null)
                {
                    if (parent is System.Windows.Controls.Primitives.ButtonBase ||
                        parent is System.Windows.Controls.CheckBox ||
                        parent is System.Windows.Controls.ComboBox ||
                        parent is System.Windows.Controls.Slider)
                    {
                        return;
                    }
                    parent = VisualTreeHelper.GetParent(parent);
                }
            }

            if (e.ClickCount == 2)
            {
                // Double-click to toggle maximize/restore
                WindowState = WindowState == WindowState.Maximized
                    ? WindowState.Normal
                    : WindowState.Maximized;
            }
            else
            {
                // Single click to drag window
                if (WindowState == WindowState.Maximized)
                {
                    // Restore before dragging when maximized
                    var mousePos = e.GetPosition(this);
                    var screenPos = PointToScreen(mousePos);
                    WindowState = WindowState.Normal;
                    Left = screenPos.X - (Width / 2);
                    Top = screenPos.Y - 20;
                }
                DragMove();
            }
        }
    }
}