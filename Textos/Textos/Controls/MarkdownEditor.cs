using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using Textos.Models;

namespace Textos.Controls
{
    public class MarkdownEditor : Control
    {
        private RichTextBox? _editBox;
        private FlowDocumentScrollViewer? _previewViewer;
        private Border? _editContainer;
        private Border? _previewContainer;
        private bool _isUpdating = false;

        public static readonly DependencyProperty TextContentProperty =
            DependencyProperty.Register("TextContent", typeof(string), typeof(MarkdownEditor),
                new FrameworkPropertyMetadata("", FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, OnTextContentChanged));

        public static readonly DependencyProperty FormattingProperty =
            DependencyProperty.Register("Formatting", typeof(FormattingSettings), typeof(MarkdownEditor),
                new PropertyMetadata(null, OnFormattingChanged));

        public static readonly DependencyProperty IsEditingProperty =
            DependencyProperty.Register("IsEditing", typeof(bool), typeof(MarkdownEditor),
                new PropertyMetadata(true, OnIsEditingChanged));

        public static readonly DependencyProperty CurrentFilePathProperty =
            DependencyProperty.Register("CurrentFilePath", typeof(string), typeof(MarkdownEditor),
                new PropertyMetadata(null));

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

        public bool IsEditing
        {
            get => (bool)GetValue(IsEditingProperty);
            set => SetValue(IsEditingProperty, value);
        }

        /// <summary>
        /// Current file path used to resolve relative image paths
        /// </summary>
        public string? CurrentFilePath
        {
            get => (string?)GetValue(CurrentFilePathProperty);
            set => SetValue(CurrentFilePathProperty, value);
        }

        static MarkdownEditor()
        {
            DefaultStyleKeyProperty.OverrideMetadata(typeof(MarkdownEditor),
                new FrameworkPropertyMetadata(typeof(MarkdownEditor)));
        }

        public override void OnApplyTemplate()
        {
            base.OnApplyTemplate();

            _editContainer = GetTemplateChild("PART_EditContainer") as Border;
            _previewContainer = GetTemplateChild("PART_PreviewContainer") as Border;
            _editBox = GetTemplateChild("PART_EditBox") as RichTextBox;
            _previewViewer = GetTemplateChild("PART_PreviewViewer") as FlowDocumentScrollViewer;

            if (_editBox != null)
            {
                _editBox.TextChanged += OnEditBoxTextChanged;
                _editBox.GotFocus += OnEditBoxGotFocus;
                _editBox.LostFocus += OnEditBoxLostFocus;
                _editBox.PreviewMouseWheel += OnPreviewMouseWheel;
                
                // Initialize with current content
                UpdateEditBox();
            }

            if (_previewContainer != null)
            {
                _previewContainer.MouseLeftButtonDown += OnPreviewClicked;
                _previewContainer.PreviewMouseWheel += OnPreviewMouseWheel;
            }

            if (_previewViewer != null)
            {
                _previewViewer.PreviewMouseWheel += OnPreviewMouseWheel;
            }

            UpdateView();
            RenderMarkdown();
        }

        private void OnPreviewMouseWheel(object sender, MouseWheelEventArgs e)
        {
            // Find the parent ScrollViewer and forward the scroll event
            var parent = VisualTreeHelper.GetParent(this) as FrameworkElement;
            while (parent != null)
            {
                if (parent is ScrollViewer scrollViewer)
                {
                    scrollViewer.ScrollToVerticalOffset(scrollViewer.VerticalOffset - e.Delta);
                    e.Handled = true;
                    return;
                }
                parent = VisualTreeHelper.GetParent(parent) as FrameworkElement;
            }
        }

        private static void OnTextContentChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is MarkdownEditor editor && !editor._isUpdating)
            {
                editor.UpdateEditBox();
                editor.RenderMarkdown();
            }
        }

        private static void OnFormattingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is MarkdownEditor editor)
            {
                editor.RenderMarkdown();
            }
        }

        private static void OnIsEditingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is MarkdownEditor editor)
            {
                editor.UpdateView();
                
                // When entering edit mode, ensure edit box is ready
                if ((bool)e.NewValue)
                {
                    editor.UpdateEditBox();
                    editor.Dispatcher.BeginInvoke(new Action(() =>
                    {
                        editor._editBox?.Focus();
                        // Move caret to end
                        if (editor._editBox != null)
                        {
                            editor._editBox.CaretPosition = editor._editBox.Document.ContentEnd;
                        }
                    }), System.Windows.Threading.DispatcherPriority.Input);
                }
            }
        }

        private void OnEditBoxGotFocus(object sender, RoutedEventArgs e)
        {
            if (!IsEditing)
            {
                IsEditing = true;
            }
        }

        private void OnEditBoxLostFocus(object sender, RoutedEventArgs e)
        {
            IsEditing = false;
            SyncTextContent();
            RenderMarkdown();
        }

        private void OnPreviewClicked(object sender, MouseButtonEventArgs e)
        {
            IsEditing = true;
            e.Handled = true;
        }

        private void OnEditBoxTextChanged(object sender, TextChangedEventArgs e)
        {
            if (_isUpdating) return;
            
            // Sync content periodically while editing
            Dispatcher.BeginInvoke(new Action(SyncTextContent), 
                System.Windows.Threading.DispatcherPriority.Background);
        }

        private void SyncTextContent()
        {
            if (_editBox == null || _isUpdating) return;

            _isUpdating = true;
            try
            {
                var range = new TextRange(_editBox.Document.ContentStart, _editBox.Document.ContentEnd);
                var text = range.Text;
                
                // Remove trailing newlines added by RichTextBox
                if (text.EndsWith("\r\n")) text = text[..^2];
                else if (text.EndsWith("\n")) text = text[..^1];
                
                TextContent = text;
            }
            finally
            {
                _isUpdating = false;
            }
        }

        private void UpdateEditBox()
        {
            if (_editBox == null) return;

            _isUpdating = true;
            try
            {
                var formatting = Formatting ?? new FormattingSettings();
                var textBrush = Application.Current?.TryFindResource("TextPrimaryBrush") as SolidColorBrush
                    ?? new SolidColorBrush(Colors.Black);

                var currentText = TextContent ?? "";
                
                // Get existing text to compare
                var range = new TextRange(_editBox.Document.ContentStart, _editBox.Document.ContentEnd);
                var existingText = range.Text.TrimEnd('\r', '\n');
                
                // Only update if content actually changed and not focused
                if (existingText != currentText && !_editBox.IsFocused)
                {
                    _editBox.Document.Blocks.Clear();
                    var paragraph = new Paragraph(new Run(currentText))
                    {
                        Margin = new Thickness(0),
                        FontFamily = new FontFamily("Consolas"),
                        FontSize = formatting.FontSizeInDiu,
                        Foreground = textBrush,
                        LineHeight = formatting.FontSizeInDiu * formatting.LineHeight
                    };
                    _editBox.Document.Blocks.Add(paragraph);
                }
                
                // Update document defaults
                _editBox.Document.FontFamily = new FontFamily("Consolas");
                _editBox.Document.FontSize = formatting.FontSizeInDiu;
                _editBox.Document.Foreground = textBrush;
            }
            finally
            {
                _isUpdating = false;
            }
        }

        private void UpdateView()
        {
            if (_editContainer != null)
                _editContainer.Visibility = IsEditing ? Visibility.Visible : Visibility.Collapsed;
            
            if (_previewContainer != null)
                _previewContainer.Visibility = IsEditing ? Visibility.Collapsed : Visibility.Visible;
        }

        private void RenderMarkdown()
        {
            if (_previewViewer == null) return;

            var formatting = Formatting ?? new FormattingSettings();
            var textBrush = Application.Current?.TryFindResource("TextPrimaryBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.Black);
            var secondaryBrush = Application.Current?.TryFindResource("TextSecondaryBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.Gray);
            var primaryBrush = Application.Current?.TryFindResource("PrimaryBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.Blue);

            var document = new FlowDocument
            {
                FontFamily = new FontFamily(formatting.FontFamily),
                FontSize = formatting.FontSizeInDiu,
                Foreground = textBrush,
                PagePadding = new Thickness(40),
                LineHeight = formatting.FontSizeInDiu * formatting.LineHeight
            };

            var lines = (TextContent ?? "").Split('\n');
            
            int i = 0;
            while (i < lines.Length)
            {
                var line = lines[i].TrimEnd('\r');
                
                // Check if this is the start of a fenced code block
                if (line.StartsWith("```"))
                {
                    var language = line.Length > 3 ? line[3..].Trim() : "";
                    var codeLines = new List<string>();
                    i++;
                    
                    // Collect code lines until closing ```
                    while (i < lines.Length && !lines[i].TrimEnd('\r').StartsWith("```"))
                    {
                        codeLines.Add(lines[i].TrimEnd('\r'));
                        i++;
                    }
                    
                    // Skip closing ```
                    if (i < lines.Length) i++;
                    
                    var codeBlock = CreateCodeBlock(codeLines, language, formatting, textBrush, primaryBrush);
                    document.Blocks.Add(codeBlock);
                }
                // Check if this is the start of a table
                else if (IsTableRow(line) && i + 1 < lines.Length && IsTableSeparator(lines[i + 1].TrimEnd('\r')))
                {
                    // Parse the entire table
                    var tableLines = new List<string> { line };
                    i++;
                    
                    // Add separator line
                    tableLines.Add(lines[i].TrimEnd('\r'));
                    i++;
                    
                    // Add data rows
                    while (i < lines.Length && IsTableRow(lines[i].TrimEnd('\r')))
                    {
                        tableLines.Add(lines[i].TrimEnd('\r'));
                        i++;
                    }
                    
                    var table = ParseMarkdownTable(tableLines, formatting, textBrush, secondaryBrush, primaryBrush);
                    document.Blocks.Add(table);
                }
                else
                {
                    var paragraph = ParseMarkdownLine(line, formatting, textBrush, secondaryBrush, primaryBrush);
                    document.Blocks.Add(paragraph);
                    i++;
                }
            }

            _previewViewer.Document = document;
        }

        private Section CreateCodeBlock(List<string> codeLines, string language, FormattingSettings formatting,
            SolidColorBrush textBrush, SolidColorBrush primaryBrush)
        {
            var codeBgBrush = Application.Current?.TryFindResource("SurfaceBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.LightGray);
            var borderBrush = Application.Current?.TryFindResource("BorderBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.Gray);

            var section = new Section
            {
                Background = codeBgBrush,
                BorderBrush = borderBrush,
                BorderThickness = new Thickness(1),
                Padding = new Thickness(16),
                Margin = new Thickness(0, 8, 0, 8)
            };

            // Add language label if specified
            if (!string.IsNullOrEmpty(language))
            {
                var languageLabel = new Paragraph(new Run(language)
                {
                    FontSize = formatting.FontSizeInDiu * 0.75,
                    Foreground = primaryBrush,
                    FontWeight = FontWeights.SemiBold
                })
                {
                    Margin = new Thickness(0, 0, 0, 8)
                };
                section.Blocks.Add(languageLabel);
            }

            // Add code lines
            foreach (var codeLine in codeLines)
            {
                var paragraph = new Paragraph(new Run(codeLine)
                {
                    FontFamily = new FontFamily("Consolas"),
                    FontSize = formatting.FontSizeInDiu * 0.9,
                    Foreground = textBrush
                })
                {
                    Margin = new Thickness(0),
                    LineHeight = formatting.FontSizeInDiu * 1.4,
                    LineStackingStrategy = LineStackingStrategy.BlockLineHeight
                };
                section.Blocks.Add(paragraph);
            }

            // If no code lines, add empty paragraph
            if (codeLines.Count == 0)
            {
                var emptyParagraph = new Paragraph(new Run(""))
                {
                    Margin = new Thickness(0)
                };
                section.Blocks.Add(emptyParagraph);
            }

            return section;
        }

        private bool IsTableRow(string line)
        {
            return line.TrimStart().StartsWith("|") && line.TrimEnd().EndsWith("|");
        }

        private bool IsTableSeparator(string line)
        {
            if (!IsTableRow(line)) return false;
            // Check if line contains only |, -, :, and spaces
            var content = line.Replace("|", "").Replace("-", "").Replace(":", "").Replace(" ", "");
            return string.IsNullOrEmpty(content);
        }

        private Table ParseMarkdownTable(List<string> tableLines, FormattingSettings formatting,
            SolidColorBrush textBrush, SolidColorBrush secondaryBrush, SolidColorBrush primaryBrush)
        {
            var table = new Table
            {
                CellSpacing = 0,
                BorderBrush = secondaryBrush,
                BorderThickness = new Thickness(1)
            };

            var surfaceBrush = Application.Current?.TryFindResource("SurfaceBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.LightGray);
            var surfaceHoverBrush = Application.Current?.TryFindResource("SurfaceHoverBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.WhiteSmoke);

            // Parse header to determine column count
            var headerCells = ParseTableRow(tableLines[0]);
            
            // Create columns
            foreach (var _ in headerCells)
            {
                table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
            }

            var rowGroup = new TableRowGroup();
            table.RowGroups.Add(rowGroup);

            // Add header row
            var headerRow = new TableRow { Background = surfaceBrush };
            foreach (var cell in headerCells)
            {
                var tableCell = new TableCell(new Paragraph(new Run(cell.Trim())
                {
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                })
                { 
                    Margin = new Thickness(0) 
                })
                {
                    Padding = new Thickness(12, 8, 12, 8),
                    BorderBrush = secondaryBrush,
                    BorderThickness = new Thickness(0, 0, 1, 1)
                };
                headerRow.Cells.Add(tableCell);
            }
            rowGroup.Rows.Add(headerRow);

            // Skip separator line (index 1) and add data rows
            for (int i = 2; i < tableLines.Count; i++)
            {
                var cells = ParseTableRow(tableLines[i]);
                var dataRow = new TableRow
                {
                    Background = i % 2 == 0 ? surfaceHoverBrush : Brushes.Transparent
                };

                for (int j = 0; j < headerCells.Length; j++)
                {
                    var cellText = j < cells.Length ? cells[j].Trim() : "";
                    var paragraph = new Paragraph { Margin = new Thickness(0) };
                    ParseInlineMarkdown(cellText, paragraph, textBrush, primaryBrush);
                    
                    var tableCell = new TableCell(paragraph)
                    {
                        Padding = new Thickness(12, 6, 12, 6),
                        BorderBrush = secondaryBrush,
                        BorderThickness = new Thickness(0, 0, 1, 1)
                    };
                    dataRow.Cells.Add(tableCell);
                }
                rowGroup.Rows.Add(dataRow);
            }

            return table;
        }

        private string[] ParseTableRow(string row)
        {
            // Remove leading and trailing |
            var trimmed = row.Trim();
            if (trimmed.StartsWith("|")) trimmed = trimmed[1..];
            if (trimmed.EndsWith("|")) trimmed = trimmed[..^1];
            
            return trimmed.Split('|');
        }

        private Paragraph ParseMarkdownLine(string line, FormattingSettings formatting, 
            SolidColorBrush textBrush, SolidColorBrush secondaryBrush, SolidColorBrush primaryBrush)
        {
            var paragraph = new Paragraph { Margin = new Thickness(0, 0, 0, 8) };
            var baseFontSize = formatting.FontSizeInDiu;

            // Headers H1-H6
            if (line.StartsWith("###### "))
            {
                paragraph.Inlines.Add(new Run(line[7..]) 
                { 
                    FontSize = baseFontSize * 0.85, 
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                });
                paragraph.Margin = new Thickness(0, 8, 0, 6);
                return paragraph;
            }
            if (line.StartsWith("##### "))
            {
                paragraph.Inlines.Add(new Run(line[6..]) 
                { 
                    FontSize = baseFontSize * 0.9, 
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                });
                paragraph.Margin = new Thickness(0, 8, 0, 6);
                return paragraph;
            }
            if (line.StartsWith("#### "))
            {
                paragraph.Inlines.Add(new Run(line[5..]) 
                { 
                    FontSize = baseFontSize * 1.0, 
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                });
                paragraph.Margin = new Thickness(0, 10, 0, 6);
                return paragraph;
            }
            if (line.StartsWith("### "))
            {
                paragraph.Inlines.Add(new Run(line[4..]) 
                { 
                    FontSize = baseFontSize * 1.17, 
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                });
                paragraph.Margin = new Thickness(0, 12, 0, 8);
                return paragraph;
            }
            if (line.StartsWith("## "))
            {
                paragraph.Inlines.Add(new Run(line[3..]) 
                { 
                    FontSize = baseFontSize * 1.5, 
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                });
                paragraph.Margin = new Thickness(0, 14, 0, 10);
                return paragraph;
            }
            if (line.StartsWith("# "))
            {
                paragraph.Inlines.Add(new Run(line[2..]) 
                { 
                    FontSize = baseFontSize * 2, 
                    FontWeight = FontWeights.Bold,
                    Foreground = textBrush
                });
                paragraph.Margin = new Thickness(0, 16, 0, 12);
                return paragraph;
            }

            // Bullet points with indentation (3 levels)
            // Level 3: 8 spaces or 2 tabs
            var bulletLevel3Match = Regex.Match(line, @"^(\t{2}|[ ]{8})[-*] (.*)$");
            if (bulletLevel3Match.Success)
            {
                paragraph.Margin = new Thickness(60, 0, 0, 4);
                paragraph.Inlines.Add(new Run("▪ ") { Foreground = secondaryBrush });
                ParseInlineMarkdown(bulletLevel3Match.Groups[2].Value, paragraph, textBrush, primaryBrush);
                return paragraph;
            }
            
            // Level 2: 4 spaces or 1 tab
            var bulletLevel2Match = Regex.Match(line, @"^(\t|[ ]{4})[-*] (.*)$");
            if (bulletLevel2Match.Success)
            {
                paragraph.Margin = new Thickness(40, 0, 0, 4);
                paragraph.Inlines.Add(new Run("◦ ") { Foreground = primaryBrush, FontSize = baseFontSize * 0.9 });
                ParseInlineMarkdown(bulletLevel2Match.Groups[2].Value, paragraph, textBrush, primaryBrush);
                return paragraph;
            }
            
            // Level 1: no indentation
            if (line.StartsWith("- ") || line.StartsWith("* "))
            {
                paragraph.Margin = new Thickness(20, 0, 0, 4);
                paragraph.Inlines.Add(new Run("• ") { Foreground = primaryBrush });
                ParseInlineMarkdown(line[2..], paragraph, textBrush, primaryBrush);
                return paragraph;
            }

            // Numbered list with indentation (3 levels)
            // Level 3: 8 spaces or 2 tabs
            var numberedLevel3Match = Regex.Match(line, @"^(\t{2}|[ ]{8})(\d+)\. (.*)$");
            if (numberedLevel3Match.Success)
            {
                paragraph.Margin = new Thickness(60, 0, 0, 4);
                paragraph.Inlines.Add(new Run($"{numberedLevel3Match.Groups[2].Value}. ") 
                { 
                    Foreground = secondaryBrush,
                    FontWeight = FontWeights.Medium,
                    FontSize = baseFontSize * 0.9
                });
                ParseInlineMarkdown(numberedLevel3Match.Groups[3].Value, paragraph, textBrush, primaryBrush);
                return paragraph;
            }
            
            // Level 2: 4 spaces or 1 tab
            var numberedLevel2Match = Regex.Match(line, @"^(\t|[ ]{4})(\d+)\. (.*)$");
            if (numberedLevel2Match.Success)
            {
                paragraph.Margin = new Thickness(40, 0, 0, 4);
                paragraph.Inlines.Add(new Run($"{numberedLevel2Match.Groups[2].Value}. ") 
                { 
                    Foreground = primaryBrush,
                    FontWeight = FontWeights.Medium
                });
                ParseInlineMarkdown(numberedLevel2Match.Groups[3].Value, paragraph, textBrush, primaryBrush);
                return paragraph;
            }
            
            // Level 1: no indentation
            var numberedMatch = Regex.Match(line, @"^(\d+)\. (.*)$");
            if (numberedMatch.Success)
            {
                paragraph.Margin = new Thickness(20, 0, 0, 4);
                paragraph.Inlines.Add(new Run($"{numberedMatch.Groups[1].Value}. ") 
                { 
                    Foreground = primaryBrush,
                    FontWeight = FontWeights.SemiBold
                });
                ParseInlineMarkdown(numberedMatch.Groups[2].Value, paragraph, textBrush, primaryBrush);
                return paragraph;
            }

            // Blockquote
            if (line.StartsWith("> "))
            {
                paragraph.Margin = new Thickness(20, 4, 0, 4);
                paragraph.BorderBrush = secondaryBrush;
                paragraph.BorderThickness = new Thickness(3, 0, 0, 0);
                paragraph.Padding = new Thickness(12, 0, 0, 0);
                ParseInlineMarkdown(line[2..], paragraph, textBrush, primaryBrush);
                // Apply italic style to existing inlines
                foreach (var inline in paragraph.Inlines)
                {
                    if (inline is Run run)
                    {
                        run.FontStyle = FontStyles.Italic;
                        run.Foreground = secondaryBrush;
                    }
                }
                return paragraph;
            }

            // Horizontal rule (multiple styles)
            if (Regex.IsMatch(line, @"^[-]{3,}$") || Regex.IsMatch(line, @"^[*]{3,}$") || Regex.IsMatch(line, @"^[_]{3,}$"))
            {
                paragraph.Margin = new Thickness(0, 12, 0, 12);
                var horizontalLine = new Line
                {
                    Stretch = Stretch.Fill,
                    Stroke = secondaryBrush,
                    StrokeThickness = 1,
                    X2 = 1
                };
                paragraph.Inlines.Add(new InlineUIContainer(horizontalLine));
                return paragraph;
            }

            // Regular text with inline formatting
            ParseInlineMarkdown(line, paragraph, textBrush, primaryBrush);
            return paragraph;
        }

        private void ParseInlineMarkdown(string text, Paragraph paragraph, 
            SolidColorBrush textBrush, SolidColorBrush primaryBrush)
        {
            // Pattern for ![alt](url), ***bold+italic***, **bold**, *italic*, `code`, and [link](url)
            // Order matters: ***text*** must come before **text** and *text*
            // Image and link patterns support:
            // - Regular paths: ![alt](path/to/image.png)
            // - Paths with spaces in angle brackets: ![alt](<path/to/image with spaces.png>)
            // - URL encoded paths: ![alt](path/to/image%20with%20spaces.png)
            var pattern = @"(!\[([^\]]*)\]\(<?([^>)\s]+(?:\s+[^>)]*)?)>?\))|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[([^\]]+)\]\(<?([^>)\s]+)>?\))";
            var matches = Regex.Matches(text, pattern);

            int lastIndex = 0;
            foreach (Match match in matches)
            {
                // Add text before match
                if (match.Index > lastIndex)
                {
                    paragraph.Inlines.Add(new Run(text[lastIndex..match.Index]) 
                    { 
                        Foreground = textBrush 
                    });
                }

                if (match.Groups[1].Success) // Image ![alt](url)
                {
                    var altText = match.Groups[2].Value;
                    var imageUrl = match.Groups[3].Value.Trim();
                    var imageElement = CreateImageElement(imageUrl, altText, primaryBrush);
                    paragraph.Inlines.Add(imageElement);
                }
                else if (match.Groups[4].Success) // Bold + Italic ***text***
                {
                    paragraph.Inlines.Add(new Run(match.Groups[5].Value) 
                    { 
                        FontWeight = FontWeights.Bold,
                        FontStyle = FontStyles.Italic,
                        Foreground = textBrush
                    });
                }
                else if (match.Groups[6].Success) // Bold **text**
                {
                    paragraph.Inlines.Add(new Run(match.Groups[7].Value) 
                    { 
                        FontWeight = FontWeights.Bold,
                        Foreground = textBrush
                    });
                }
                else if (match.Groups[8].Success) // Italic *text*
                {
                    paragraph.Inlines.Add(new Run(match.Groups[9].Value) 
                    { 
                        FontStyle = FontStyles.Italic,
                        Foreground = textBrush
                    });
                }
                else if (match.Groups[10].Success) // Code `text`
                {
                    var codeBg = Application.Current?.TryFindResource("SurfaceHoverBrush") as SolidColorBrush
                        ?? new SolidColorBrush(Colors.LightGray);
                    paragraph.Inlines.Add(new Run(match.Groups[11].Value) 
                    { 
                        FontFamily = new FontFamily("Consolas"),
                        Background = codeBg,
                        Foreground = primaryBrush
                    });
                }
                else if (match.Groups[12].Success) // Link [text](url)
                {
                    var hyperlink = new Hyperlink(new Run(match.Groups[13].Value))
                    {
                        Foreground = primaryBrush,
                        TextDecorations = TextDecorations.Underline
                    };
                    try
                    {
                        var linkUrl = match.Groups[14].Value.Trim();
                        hyperlink.NavigateUri = new Uri(DecodeUrlPath(linkUrl));
                        hyperlink.RequestNavigate += (s, e) =>
                        {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = e.Uri.AbsoluteUri,
                                UseShellExecute = true
                            });
                            e.Handled = true;
                        };
                    }
                    catch { }
                    paragraph.Inlines.Add(hyperlink);
                }

                lastIndex = match.Index + match.Length;
            }

            // Add remaining text
            if (lastIndex < text.Length)
            {
                paragraph.Inlines.Add(new Run(text[lastIndex..]) 
                { 
                    Foreground = textBrush 
                });
            }

            // If no text was added, add empty run
            if (paragraph.Inlines.Count == 0)
            {
                paragraph.Inlines.Add(new Run("") { Foreground = textBrush });
            }
        }

        private string DecodeUrlPath(string path)
        {
            // Decode URL-encoded characters (e.g., %20 -> space)
            try
            {
                return Uri.UnescapeDataString(path);
            }
            catch
            {
                return path;
            }
        }

        /// <summary>
        /// Resolves an image path to an absolute path.
        /// If the path is relative, it's resolved relative to the current file's directory.
        /// If the path is absolute, it's returned as-is.
        /// </summary>
        private string ResolveImagePath(string imagePath)
        {
            // If already an absolute path, return as-is
            if (System.IO.Path.IsPathRooted(imagePath))
            {
                return imagePath;
            }

            // Try to resolve relative to current file's directory
            if (!string.IsNullOrEmpty(CurrentFilePath))
            {
                var fileDirectory = System.IO.Path.GetDirectoryName(CurrentFilePath);
                if (!string.IsNullOrEmpty(fileDirectory))
                {
                    var resolvedPath = System.IO.Path.Combine(fileDirectory, imagePath);
                    var normalizedPath = System.IO.Path.GetFullPath(resolvedPath);
                    return normalizedPath;
                }
            }

            // Fallback: resolve relative to current working directory
            return System.IO.Path.GetFullPath(imagePath);
        }

        private Inline CreateImageElement(string imageUrl, string altText, SolidColorBrush primaryBrush)
        {
            try
            {
                // Decode URL-encoded path
                var decodedUrl = DecodeUrlPath(imageUrl);
                
                var image = new Image
                {
                    Stretch = Stretch.Uniform,
                    MaxWidth = 600,
                    MaxHeight = 400,
                    Margin = new Thickness(0, 8, 0, 8)
                };

                // Handle both local files and URLs
                BitmapImage bitmap;
                if (decodedUrl.StartsWith("http://") || decodedUrl.StartsWith("https://"))
                {
                    bitmap = new BitmapImage();
                    bitmap.BeginInit();
                    bitmap.UriSource = new Uri(imageUrl); // Use original URL for web
                    bitmap.CacheOption = BitmapCacheOption.OnLoad;
                    bitmap.EndInit();
                }
                else
                {
                    // Local file path - resolve relative to current file
                    var fullPath = ResolveImagePath(decodedUrl);
                    
                    if (System.IO.File.Exists(fullPath))
                    {
                        bitmap = new BitmapImage();
                        bitmap.BeginInit();
                        bitmap.UriSource = new Uri(fullPath);
                        bitmap.CacheOption = BitmapCacheOption.OnLoad;
                        bitmap.EndInit();
                    }
                    else
                    {
                        // File not found, show placeholder
                        return CreateImagePlaceholder(altText, decodedUrl, primaryBrush);
                    }
                }

                image.Source = bitmap;
                image.ToolTip = string.IsNullOrEmpty(altText) ? decodedUrl : altText;

                var container = new InlineUIContainer(image);
                return container;
            }
            catch
            {
                // Error loading image, show placeholder
                return CreateImagePlaceholder(altText, imageUrl, primaryBrush);
            }
        }

        private Inline CreateImagePlaceholder(string altText, string imageUrl, SolidColorBrush primaryBrush)
        {
            var surfaceBrush = Application.Current?.TryFindResource("SurfaceBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.LightGray);
            var textBrush = Application.Current?.TryFindResource("TextSecondaryBrush") as SolidColorBrush
                ?? new SolidColorBrush(Colors.Gray);

            var border = new Border
            {
                Background = surfaceBrush,
                BorderBrush = primaryBrush,
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(4),
                Padding = new Thickness(12, 8, 12, 8),
                Margin = new Thickness(0, 4, 0, 4)
            };

            var stackPanel = new StackPanel { Orientation = Orientation.Horizontal };
            
            stackPanel.Children.Add(new TextBlock
            {
                Text = "🖼 ",
                FontSize = 14,
                VerticalAlignment = VerticalAlignment.Center
            });
            
            stackPanel.Children.Add(new TextBlock
            {
                Text = string.IsNullOrEmpty(altText) ? $"[Image: {imageUrl}]" : $"[{altText}]",
                Foreground = textBrush,
                FontStyle = FontStyles.Italic,
                VerticalAlignment = VerticalAlignment.Center,
                ToolTip = imageUrl
            });

            border.Child = stackPanel;
            return new InlineUIContainer(border);
        }
    }
}
