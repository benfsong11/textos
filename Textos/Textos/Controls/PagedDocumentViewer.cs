using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using Textos.Models;

namespace Textos.Controls
{
    public class PagedDocumentViewer : Control
    {
        // A4 size at 96 DPI: 794 x 1123 pixels (210mm x 297mm)
        public const double A4WidthPixels = 794;
        public const double A4HeightPixels = 1123;
        public const double PageMargin = 60;
        public const double PageGap = 24;

        private ScrollViewer? _scrollViewer;
        private StackPanel? _pagesPanel;
        private List<RichTextBox> _pageEditors = new();
        private bool _isUpdating = false;
        private int _focusedPageIndex = 0;

        public static readonly DependencyProperty TextContentProperty =
            DependencyProperty.Register("TextContent", typeof(string), typeof(PagedDocumentViewer),
                new FrameworkPropertyMetadata("", FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, OnTextContentChanged));

        public static readonly DependencyProperty FormattingProperty =
            DependencyProperty.Register("Formatting", typeof(FormattingSettings), typeof(PagedDocumentViewer),
                new PropertyMetadata(null, OnFormattingChanged));

        public static readonly DependencyProperty CurrentPageProperty =
            DependencyProperty.Register("CurrentPage", typeof(int), typeof(PagedDocumentViewer),
                new PropertyMetadata(1));

        public static readonly DependencyProperty TotalPagesProperty =
            DependencyProperty.Register("TotalPages", typeof(int), typeof(PagedDocumentViewer),
                new PropertyMetadata(1));

        public string TextContent
        {
            get => (string)GetValue(TextContentProperty);
            set => SetValue(TextContentProperty, value);
        }

        public FormattingSettings Formatting
        {
            get => (FormattingSettings)GetValue(FormattingProperty);
            set => SetValue(FormattingProperty, value);
        }

        public int CurrentPage
        {
            get => (int)GetValue(CurrentPageProperty);
            set => SetValue(CurrentPageProperty, value);
        }

        public int TotalPages
        {
            get => (int)GetValue(TotalPagesProperty);
            set => SetValue(TotalPagesProperty, value);
        }

        static PagedDocumentViewer()
        {
            DefaultStyleKeyProperty.OverrideMetadata(typeof(PagedDocumentViewer),
                new FrameworkPropertyMetadata(typeof(PagedDocumentViewer)));
        }

        public override void OnApplyTemplate()
        {
            base.OnApplyTemplate();
            
            _scrollViewer = GetTemplateChild("PART_ScrollViewer") as ScrollViewer;
            _pagesPanel = GetTemplateChild("PART_PagesPanel") as StackPanel;

            if (_scrollViewer != null)
            {
                _scrollViewer.ScrollChanged += OnScrollChanged;
            }

            // Update pages when visibility changes (handles theme changes)
            IsVisibleChanged += OnVisibilityChanged;

            UpdatePages();
        }

        private void OnVisibilityChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            if (e.NewValue is true)
            {
                // Refresh pages when becoming visible to pick up theme changes
                UpdatePages();
            }
        }

        private static void OnTextContentChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is PagedDocumentViewer viewer && !viewer._isUpdating)
            {
                viewer.UpdatePages();
            }
        }

        private static void OnFormattingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is PagedDocumentViewer viewer)
            {
                if (e.OldValue is FormattingSettings oldSettings)
                {
                    oldSettings.PropertyChanged -= viewer.OnFormattingPropertyChanged;
                }
                if (e.NewValue is FormattingSettings newSettings)
                {
                    newSettings.PropertyChanged += viewer.OnFormattingPropertyChanged;
                }
                viewer.UpdatePages();
            }
        }

        private void OnFormattingPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            UpdatePages();
        }

        private void OnScrollChanged(object sender, ScrollChangedEventArgs e)
        {
            if (_pagesPanel == null || _pagesPanel.Children.Count == 0) return;

            var scrollOffset = e.VerticalOffset;
            var pageHeight = A4HeightPixels + PageGap;
            var currentPage = (int)(scrollOffset / pageHeight) + 1;
            CurrentPage = Math.Max(1, Math.Min(currentPage, TotalPages));
        }

        private void UpdatePages()
        {
            if (_pagesPanel == null) return;

            _isUpdating = true;
            try
            {
                var formatting = Formatting ?? new FormattingSettings();
                var text = TextContent ?? "";

                // Get theme colors from Application resources (always get fresh values)
                var textBrush = Application.Current?.TryFindResource("TextPrimaryBrush") as SolidColorBrush 
                    ?? new SolidColorBrush(Colors.Black);
                var pageBgBrush = Application.Current?.TryFindResource("EditorBgBrush") as SolidColorBrush 
                    ?? new SolidColorBrush(Colors.White);

                // Calculate content area per page
                var contentHeight = A4HeightPixels - (PageMargin * 2);

                // Split text into pages
                var pageTexts = PaginateText(text, formatting, contentHeight);
                TotalPages = Math.Max(1, pageTexts.Count);

                // Disconnect editors from their current parent borders before clearing
                foreach (var editor in _pageEditors)
                {
                    if (editor.Parent is Border border)
                    {
                        border.Child = null;
                    }
                }

                // Ensure we have enough page editors
                while (_pageEditors.Count < pageTexts.Count)
                {
                    var editor = CreatePageEditor(formatting, textBrush, pageBgBrush);
                    _pageEditors.Add(editor);
                }

                // Clear and rebuild pages panel
                _pagesPanel.Children.Clear();

                for (int i = 0; i < pageTexts.Count; i++)
                {
                    var pageContainer = CreatePageContainer(_pageEditors[i], pageBgBrush, i + 1);
                    SetEditorText(_pageEditors[i], pageTexts[i], formatting, textBrush);
                    _pagesPanel.Children.Add(pageContainer);
                }

                // Add empty page if no content
                if (pageTexts.Count == 0)
                {
                    if (_pageEditors.Count == 0)
                    {
                        var editor = CreatePageEditor(formatting, textBrush, pageBgBrush);
                        _pageEditors.Add(editor);
                    }
                    var pageContainer = CreatePageContainer(_pageEditors[0], pageBgBrush, 1);
                    SetEditorText(_pageEditors[0], "", formatting, textBrush);
                    _pagesPanel.Children.Add(pageContainer);
                    TotalPages = 1;
                }

                CurrentPage = Math.Max(1, Math.Min(_focusedPageIndex + 1, TotalPages));
            }
            finally
            {
                _isUpdating = false;
            }
        }

        private RichTextBox CreatePageEditor(FormattingSettings formatting, SolidColorBrush textBrush, SolidColorBrush bgBrush)
        {
            var editor = new RichTextBox
            {
                BorderThickness = new Thickness(0),
                Background = Brushes.Transparent,
                Foreground = textBrush,
                Padding = new Thickness(PageMargin),
                VerticalScrollBarVisibility = ScrollBarVisibility.Disabled,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                AcceptsReturn = true,
                AcceptsTab = true
            };

            editor.Document.PageWidth = A4WidthPixels - (PageMargin * 2);

            // Handle text changes for real-time overflow detection
            editor.TextChanged += OnPageEditorTextChanged;
            editor.GotFocus += OnPageEditorGotFocus;
            editor.PreviewKeyDown += OnPageEditorPreviewKeyDown;

            return editor;
        }

        private void OnPageEditorGotFocus(object sender, RoutedEventArgs e)
        {
            if (sender is RichTextBox editor)
            {
                _focusedPageIndex = _pageEditors.IndexOf(editor);
                if (_focusedPageIndex >= 0)
                {
                    CurrentPage = _focusedPageIndex + 1;
                }
            }
        }

        private void OnPageEditorPreviewKeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (sender is not RichTextBox editor) return;

            var pageIndex = _pageEditors.IndexOf(editor);
            if (pageIndex < 0) return;

            // Handle navigation between pages with arrow keys
            if (e.Key == System.Windows.Input.Key.Down || e.Key == System.Windows.Input.Key.Right)
            {
                var caretPos = editor.CaretPosition;
                var endPos = editor.Document.ContentEnd;
                
                if (caretPos.GetOffsetToPosition(endPos) <= 2 && pageIndex < TotalPages - 1)
                {
                    // Move to next page
                    var nextEditor = _pageEditors[pageIndex + 1];
                    if (nextEditor.Parent != null)
                    {
                        nextEditor.Focus();
                        nextEditor.CaretPosition = nextEditor.Document.ContentStart;
                        e.Handled = true;
                    }
                }
            }
            else if (e.Key == System.Windows.Input.Key.Up || e.Key == System.Windows.Input.Key.Left)
            {
                var caretPos = editor.CaretPosition;
                var startPos = editor.Document.ContentStart;
                
                if (startPos.GetOffsetToPosition(caretPos) <= 2 && pageIndex > 0)
                {
                    // Move to previous page
                    var prevEditor = _pageEditors[pageIndex - 1];
                    if (prevEditor.Parent != null)
                    {
                        prevEditor.Focus();
                        prevEditor.CaretPosition = prevEditor.Document.ContentEnd;
                        e.Handled = true;
                    }
                }
            }
        }

        private void OnPageEditorTextChanged(object sender, TextChangedEventArgs e)
        {
            if (_isUpdating) return;
            
            if (sender is RichTextBox editor)
            {
                // Check for overflow and handle it
                Dispatcher.BeginInvoke(new Action(() => CheckAndHandleOverflow(editor)), 
                    System.Windows.Threading.DispatcherPriority.Background);
            }
        }

        private void CheckAndHandleOverflow(RichTextBox editor)
        {
            if (_isUpdating) return;

            var pageIndex = _pageEditors.IndexOf(editor);
            if (pageIndex < 0 || editor.Parent == null) return;

            // Get actual rendered height of the document
            editor.UpdateLayout();
            
            var contentHeight = A4HeightPixels - (PageMargin * 2);
            var documentHeight = GetDocumentHeight(editor);

            if (documentHeight > contentHeight + 10) // Small tolerance
            {
                // Overflow detected - need to redistribute text
                _focusedPageIndex = pageIndex;
                SyncAndRedistribute();
            }
        }

        private double GetDocumentHeight(RichTextBox editor)
        {
            var formatting = Formatting ?? new FormattingSettings();
            var fontSizeInDiu = formatting.FontSizeInDiu;
            var lineHeight = fontSizeInDiu * formatting.LineHeight;
            var contentWidth = A4WidthPixels - (PageMargin * 2);
            
            double totalHeight = 0;
            var range = new TextRange(editor.Document.ContentStart, editor.Document.ContentEnd);
            var text = range.Text.TrimEnd('\r', '\n');
            var lines = text.Split('\n');

            foreach (var line in lines)
            {
                var textWidth = EstimateTextWidth(line.TrimEnd('\r'), formatting);
                var wrappedLines = Math.Max(1, Math.Ceiling(textWidth / contentWidth));
                totalHeight += lineHeight * wrappedLines;
            }

            return totalHeight;
        }

        private void SyncAndRedistribute()
        {
            if (_isUpdating) return;

            _isUpdating = true;
            string allText;
            try
            {
                // Collect all text from visible editors
                var textBuilder = new System.Text.StringBuilder();
                for (int i = 0; i < _pageEditors.Count; i++)
                {
                    var editor = _pageEditors[i];
                    if (editor.Parent != null)
                    {
                        var range = new TextRange(editor.Document.ContentStart, editor.Document.ContentEnd);
                        var text = range.Text;
                        if (text.EndsWith("\r\n")) text = text[..^2];
                        else if (text.EndsWith("\n")) text = text[..^1];
                        
                        if (textBuilder.Length > 0 && !string.IsNullOrEmpty(text))
                            textBuilder.AppendLine();
                        textBuilder.Append(text);
                    }
                }

                allText = textBuilder.ToString();
                TextContent = allText;
            }
            finally
            {
                _isUpdating = false;
            }

            // Trigger page update
            UpdatePages();

            // Restore focus to appropriate page and position
            RestoreFocus();
        }

        private void RestoreFocus()
        {
            Dispatcher.BeginInvoke(new Action(() =>
            {
                var targetPage = Math.Min(_focusedPageIndex, _pageEditors.Count - 1);
                if (targetPage >= 0 && targetPage < _pageEditors.Count)
                {
                    var editor = _pageEditors[targetPage];
                    if (editor.Parent != null)
                    {
                        editor.Focus();
                        editor.CaretPosition = editor.Document.ContentEnd;
                        
                        // Scroll to show the focused page
                        if (_scrollViewer != null)
                        {
                            var offset = targetPage * (A4HeightPixels + PageGap);
                            _scrollViewer.ScrollToVerticalOffset(offset);
                        }
                    }
                }
            }), System.Windows.Threading.DispatcherPriority.Input);
        }

        private Border CreatePageContainer(RichTextBox editor, SolidColorBrush bgBrush, int pageNumber)
        {
            var pageContainer = new Border
            {
                Width = A4WidthPixels,
                Height = A4HeightPixels,
                Background = bgBrush,
                Margin = new Thickness(0, 0, 0, PageGap),
                CornerRadius = new CornerRadius(8),
                ClipToBounds = true,
                Child = editor
            };

            pageContainer.Effect = new System.Windows.Media.Effects.DropShadowEffect
            {
                BlurRadius = 20,
                ShadowDepth = 0,
                Opacity = 0.15,
                Color = Colors.Black
            };

            return pageContainer;
        }

        private void SetEditorText(RichTextBox editor, string text, FormattingSettings formatting, SolidColorBrush textBrush)
        {
            editor.Document.Blocks.Clear();
            
            var fontSizeInDiu = formatting.FontSizeInDiu;
            
            var paragraph = new Paragraph(new Run(text))
            {
                Margin = new Thickness(0),
                FontFamily = new FontFamily(formatting.FontFamily),
                FontSize = fontSizeInDiu,
                Foreground = textBrush,
                LineHeight = fontSizeInDiu * formatting.LineHeight,
                LineStackingStrategy = LineStackingStrategy.BlockLineHeight
            };

            editor.Document.Blocks.Add(paragraph);
        }

        private List<string> PaginateText(string text, FormattingSettings formatting, double contentHeight)
        {
            var pages = new List<string>();
            if (string.IsNullOrEmpty(text))
            {
                pages.Add("");
                return pages;
            }

            var lines = text.Split('\n');
            var currentPageLines = new List<string>();
            double currentHeight = 0;
            var fontSizeInDiu = formatting.FontSizeInDiu;
            var lineHeight = fontSizeInDiu * formatting.LineHeight;
            var contentWidth = A4WidthPixels - (PageMargin * 2);

            foreach (var line in lines)
            {
                var lineText = line.TrimEnd('\r');
                
                // Estimate wrapped lines
                var textWidth = EstimateTextWidth(lineText, formatting);
                var estimatedWrappedLines = Math.Max(1, (int)Math.Ceiling(textWidth / contentWidth));
                var totalLineHeight = lineHeight * estimatedWrappedLines;

                if (currentHeight + totalLineHeight > contentHeight && currentPageLines.Count > 0)
                {
                    // Start new page
                    pages.Add(string.Join("\n", currentPageLines));
                    currentPageLines.Clear();
                    currentHeight = 0;
                }

                currentPageLines.Add(lineText);
                currentHeight += totalLineHeight;
            }

            // Add remaining lines
            if (currentPageLines.Count > 0)
            {
                pages.Add(string.Join("\n", currentPageLines));
            }

            return pages;
        }

        private double EstimateTextWidth(string text, FormattingSettings formatting)
        {
            if (string.IsNullOrEmpty(text)) return 0;

            var fontSizeInDiu = formatting.FontSizeInDiu;

            try
            {
                var formattedText = new FormattedText(
                    text,
                    System.Globalization.CultureInfo.CurrentCulture,
                    FlowDirection.LeftToRight,
                    new Typeface(
                        new FontFamily(formatting.FontFamily),
                        FontStyles.Normal,
                        FontWeights.Normal,
                        FontStretches.Normal),
                    fontSizeInDiu,
                    Brushes.Black,
                    new NumberSubstitution(),
                    TextFormattingMode.Display,
                    96);

                return formattedText.Width;
            }
            catch
            {
                // Fallback to rough estimation
                var avgCharWidth = fontSizeInDiu * 0.5;
                return text.Length * avgCharWidth;
            }
        }
    }
}
