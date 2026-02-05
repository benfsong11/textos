using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using Textos.Models;

namespace Textos.Controls
{
    public class FormattedTextBox : RichTextBox
    {
        public static readonly DependencyProperty FormattingProperty =
            DependencyProperty.Register("Formatting", typeof(FormattingSettings), typeof(FormattedTextBox),
                new PropertyMetadata(new FormattingSettings(), OnFormattingChanged));

        public FormattingSettings Formatting
        {
            get => (FormattingSettings)GetValue(FormattingProperty);
            set => SetValue(FormattingProperty, value);
        }

        public FormattedTextBox()
        {
            // Initialize document with proper settings
            Document.Blocks.Clear();
            Document.PageWidth = 2000;
            var paragraph = new Paragraph
            {
                Margin = new Thickness(0),
                LineStackingStrategy = LineStackingStrategy.MaxHeight
            };
            Document.Blocks.Add(paragraph);
            
            // Update PageWidth on size change
            this.SizeChanged += (s, e) =>
            {
                if (this.ActualWidth > 0)
                    Document.PageWidth = this.ActualWidth;
            };
            
            // Apply formatting after loaded
            this.Loaded += (s, e) => ApplyFormatting();
            
            // Apply formatting when text changes to maintain consistent styling
            this.TextChanged += (s, e) => ApplyFormattingToNewContent();
        }

        private static void OnFormattingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is FormattedTextBox textBox)
            {
                if (e.OldValue is FormattingSettings oldFormatting)
                {
                    oldFormatting.PropertyChanged -= textBox.OnFormattingPropertyChanged;
                }

                if (e.NewValue is FormattingSettings newFormatting)
                {
                    newFormatting.PropertyChanged += textBox.OnFormattingPropertyChanged;
                }

                textBox.ApplyFormatting();
            }
        }

        private void OnFormattingPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            ApplyFormatting();
        }

        private void ApplyFormatting()
        {
            if (Document.Blocks.Count == 0)
                return;

            var formatting = Formatting;
            
            // Get theme colors from application resources
            var textBrush = Application.Current?.TryFindResource("TextPrimaryBrush") as SolidColorBrush 
                ?? new SolidColorBrush(Colors.Black);

            // Use FontSizeInDiu for actual rendering (converts points to DIU)
            var fontSizeInDiu = formatting.FontSizeInDiu;
            var fontFamily = new FontFamily(formatting.FontFamily);

            // Set document-level defaults for new content
            Document.FontFamily = fontFamily;
            Document.FontSize = fontSizeInDiu;
            Document.Foreground = textBrush;

            foreach (var block in Document.Blocks)
            {
                if (block is Paragraph paragraph)
                {
                    paragraph.FontFamily = fontFamily;
                    paragraph.FontSize = fontSizeInDiu;
                    paragraph.Foreground = textBrush;
                    paragraph.LineHeight = fontSizeInDiu * formatting.LineHeight;
                    paragraph.LineStackingStrategy = LineStackingStrategy.BlockLineHeight;
                    paragraph.Margin = new Thickness(0);

                    foreach (var inline in paragraph.Inlines)
                    {
                        if (inline is Run run)
                        {
                            run.FontFamily = fontFamily;
                            run.FontSize = fontSizeInDiu;
                            run.Foreground = textBrush;
                        }
                    }
                }
            }
        }

        private void ApplyFormattingToNewContent()
        {
            var formatting = Formatting;
            var fontSizeInDiu = formatting.FontSizeInDiu;
            var fontFamily = new FontFamily(formatting.FontFamily);
            
            // Ensure document defaults are set
            Document.FontFamily = fontFamily;
            Document.FontSize = fontSizeInDiu;
        }
    }
}
