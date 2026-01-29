using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Media;

namespace Textos.Models
{
    public class FormattingSettings : INotifyPropertyChanged
    {
        // 1 point = 1/72 inch, 1 DIU = 1/96 inch
        // Point to DIU: pt * (96/72) = pt * 1.3333...
        private const double PointToDiu = 96.0 / 72.0;
        
        private string _fontFamily = "Segoe UI";
        private int _fontSizeInPoints = 12; // 인쇄 기준 포인트
        private Color _textColor = Colors.Black;
        private Color _backgroundColor = Colors.White;
        private double _lineHeight = 1.5;

        public event PropertyChangedEventHandler? PropertyChanged;

        public string FontFamily
        {
            get => _fontFamily;
            set
            {
                if (_fontFamily != value)
                {
                    _fontFamily = value;
                    OnPropertyChanged();
                }
            }
        }

        /// <summary>
        /// Font size in points (pt) - print standard unit (1pt = 1/72 inch)
        /// </summary>
        public int FontSize
        {
            get => _fontSizeInPoints;
            set
            {
                if (_fontSizeInPoints != value)
                {
                    _fontSizeInPoints = value;
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(FontSizeInDiu));
                }
            }
        }

        /// <summary>
        /// Font size in WPF DIU (Device Independent Units) for actual rendering
        /// </summary>
        public double FontSizeInDiu => _fontSizeInPoints * PointToDiu;

        public Color TextColor
        {
            get => _textColor;
            set
            {
                if (_textColor != value)
                {
                    _textColor = value;
                    OnPropertyChanged();
                }
            }
        }

        public Color BackgroundColor
        {
            get => _backgroundColor;
            set
            {
                if (_backgroundColor != value)
                {
                    _backgroundColor = value;
                    OnPropertyChanged();
                }
            }
        }

        public double LineHeight
        {
            get => _lineHeight;
            set
            {
                // 소수점 한자리까지만
                double rounded = Math.Round(value, 1);
                if (_lineHeight != rounded)
                {
                    _lineHeight = rounded;
                    OnPropertyChanged();
                }
            }
        }

        public FormattingSettings Clone()
        {
            return new FormattingSettings
            {
                FontFamily = this.FontFamily,
                FontSize = this.FontSize,
                TextColor = this.TextColor,
                BackgroundColor = this.BackgroundColor,
                LineHeight = this.LineHeight
            };
        }

        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
