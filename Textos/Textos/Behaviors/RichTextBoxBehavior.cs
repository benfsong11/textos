using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Collections.Generic;

namespace Textos.Behaviors
{
    public static class RichTextBoxBehavior
    {
        private static readonly HashSet<RichTextBox> _initializedBoxes = new();
        private static readonly HashSet<RichTextBox> _updatingBoxes = new();

        public static string GetPlainText(DependencyObject obj)
        {
            return (string)obj.GetValue(PlainTextProperty);
        }

        public static void SetPlainText(DependencyObject obj, string value)
        {
            obj.SetValue(PlainTextProperty, value);
        }

        public static readonly DependencyProperty PlainTextProperty =
            DependencyProperty.RegisterAttached(
                "PlainText",
                typeof(string),
                typeof(RichTextBoxBehavior),
                new FrameworkPropertyMetadata(
                    "",
                    FrameworkPropertyMetadataOptions.BindsTwoWayByDefault,
                    OnPlainTextPropertyChanged));

        private static void OnPlainTextPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is not RichTextBox rtb)
                return;

            // Initialize on first attachment
            if (!_initializedBoxes.Contains(rtb))
            {
                _initializedBoxes.Add(rtb);
                rtb.TextChanged += OnRichTextBoxTextChanged;
                
                // Re-sync content when visibility changes (for mode switching)
                rtb.IsVisibleChanged += OnRichTextBoxVisibleChanged;
                
                rtb.Unloaded += (s, _) =>
                {
                    if (s is RichTextBox box)
                    {
                        _initializedBoxes.Remove(box);
                        _updatingBoxes.Remove(box);
                    }
                };
            }

            // Skip if internal update
            if (_updatingBoxes.Contains(rtb))
                return;

            string newText = (string)e.NewValue ?? "";
            string currentText = ExtractPlainText(rtb);

            if (currentText != newText)
            {
                _updatingBoxes.Add(rtb);
                try
                {
                    UpdateRichTextBoxContent(rtb, newText);
                }
                finally
                {
                    _updatingBoxes.Remove(rtb);
                }
            }
        }

        private static void OnRichTextBoxVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            if (sender is not RichTextBox rtb)
                return;

            // When becoming visible, sync with the bound value
            if ((bool)e.NewValue == true)
            {
                string boundText = GetPlainText(rtb);
                string currentText = ExtractPlainText(rtb);

                if (currentText != boundText && !_updatingBoxes.Contains(rtb))
                {
                    _updatingBoxes.Add(rtb);
                    try
                    {
                        UpdateRichTextBoxContent(rtb, boundText);
                    }
                    finally
                    {
                        _updatingBoxes.Remove(rtb);
                    }
                }
            }
        }

        private static void OnRichTextBoxTextChanged(object sender, TextChangedEventArgs e)
        {
            if (sender is not RichTextBox rtb)
                return;

            if (_updatingBoxes.Contains(rtb))
                return;

            string currentText = ExtractPlainText(rtb);
            string boundText = GetPlainText(rtb);

            if (currentText != boundText)
            {
                _updatingBoxes.Add(rtb);
                try
                {
                    // SetCurrentValue를 사용하여 바인딩 유지
                    rtb.SetCurrentValue(PlainTextProperty, currentText);
                }
                finally
                {
                    _updatingBoxes.Remove(rtb);
                }
            }
        }

        private static void UpdateRichTextBoxContent(RichTextBox rtb, string text)
        {
            // 기존 Paragraph/Run 구조 재사용 (커서 위치 유지)
            if (rtb.Document.Blocks.FirstBlock is Paragraph para)
            {
                if (para.Inlines.FirstInline is Run run)
                {
                    run.Text = text ?? "";
                    return;
                }
                
                para.Inlines.Clear();
                if (!string.IsNullOrEmpty(text))
                {
                    para.Inlines.Add(new Run { Text = text });
                }
                return;
            }

            // 구조가 없으면 새로 생성
            rtb.Document.Blocks.Clear();
            var paragraph = new Paragraph { Margin = new Thickness(0) };
            if (!string.IsNullOrEmpty(text))
            {
                paragraph.Inlines.Add(new Run { Text = text });
            }
            rtb.Document.Blocks.Add(paragraph);
        }

        public static string ExtractPlainText(RichTextBox rtb)
        {
            if (rtb == null) return "";

            var textRange = new TextRange(rtb.Document.ContentStart, rtb.Document.ContentEnd);
            string text = textRange.Text;

            // RichTextBox 자동 줄바꿈 제거
            if (text.EndsWith("\r\n"))
                text = text[..^2];
            else if (text.EndsWith("\n"))
                text = text[..^1];

            return text;
        }

        public static void InitializeRichTextBox(RichTextBox rtb)
        {
            // 이제 OnPlainTextPropertyChanged에서 자동으로 초기화됨
        }
    }
}
