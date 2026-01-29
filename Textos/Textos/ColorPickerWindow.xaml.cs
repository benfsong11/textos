using System.Windows;
using System.Windows.Media;

namespace Textos
{
    /// <summary>
    /// Interaction logic for ColorPickerWindow.xaml
    /// </summary>
    public partial class ColorPickerWindow : Window
    {
        public Color SelectedColor { get; private set; } = Colors.Black;

        public ColorPickerWindow()
        {
            InitializeComponent();
        }

        private void OkButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
            Close();
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void UpdateSelectedColor()
        {
            byte r = (byte)(RSlider.Value);
            byte g = (byte)(GSlider.Value);
            byte b = (byte)(BSlider.Value);
            SelectedColor = Color.FromRgb(r, g, b);
        }

        private void RSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            UpdateSelectedColor();
        }

        private void GSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            UpdateSelectedColor();
        }

        private void BSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            UpdateSelectedColor();
        }
    }
}
