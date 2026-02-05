using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Textos.Models;
using Textos.Services;

namespace Textos.ViewModels
{
    public class EditorViewModel : ObservableObject
    {
        private string _textContent = "";
        private string? _currentFilePath;
        private FormattingSettings _formatting;
        private FormattingSettings _markdownFormatting;
        private bool _hasUnsavedChanges = false;
        private bool _isDarkMode = true;
        private bool _isMarkdownMode = false;
        private int _currentPage = 1;
        private int _totalPages = 1;

        public string TextContent
        {
            get => _textContent;
            set
            {
                if (SetProperty(ref _textContent, value))
                {
                    HasUnsavedChanges = true;
                }
            }
        }

        public string? CurrentFilePath
        {
            get => _currentFilePath;
            set
            {
                if (SetProperty(ref _currentFilePath, value))
                {
                    OnPropertyChanged(nameof(CurrentFileName));
                    OnPropertyChanged(nameof(CurrentFilePathTooltip));
                    UpdateFileMode();
                }
            }
        }

        public string CurrentFileName
        {
            get
            {
                if (string.IsNullOrEmpty(_currentFilePath))
                    return "New Document";
                return Path.GetFileName(_currentFilePath);
            }
        }

        public string? CurrentFilePathTooltip
        {
            get
            {
                if (string.IsNullOrEmpty(_currentFilePath))
                    return null;
                return _currentFilePath;
            }
        }

        public FormattingSettings Formatting
        {
            get => _formatting;
            set => SetProperty(ref _formatting, value);
        }

        /// <summary>
        /// Fixed formatting for Markdown mode: Segoe UI, 12pt, 1.5 line height
        /// </summary>
        public FormattingSettings MarkdownFormatting
        {
            get => _markdownFormatting;
            set => SetProperty(ref _markdownFormatting, value);
        }

        public bool HasUnsavedChanges
        {
            get => _hasUnsavedChanges;
            set => SetProperty(ref _hasUnsavedChanges, value);
        }

        public bool IsDarkMode
        {
            get => _isDarkMode;
            set
            {
                if (SetProperty(ref _isDarkMode, value))
                {
                    ApplyTheme();
                }
            }
        }

        /// <summary>
        /// True if current file is markdown (.md), false for text (.txt)
        /// </summary>
        public bool IsMarkdownMode
        {
            get => _isMarkdownMode;
            private set
            {
                if (SetProperty(ref _isMarkdownMode, value))
                {
                    OnPropertyChanged(nameof(IsTextMode));
                }
            }
        }

        /// <summary>
        /// True if current file is plain text (.txt)
        /// </summary>
        public bool IsTextMode => !_isMarkdownMode;

        public int CurrentPage
        {
            get => _currentPage;
            set => SetProperty(ref _currentPage, value);
        }

        public int TotalPages
        {
            get => _totalPages;
            set => SetProperty(ref _totalPages, value);
        }

        public IAsyncRelayCommand SaveCommand { get; }
        public IAsyncRelayCommand OpenCommand { get; }
        public IAsyncRelayCommand NewCommand { get; }
        public IAsyncRelayCommand NewMarkdownCommand { get; }
        public RelayCommand ResetFormattingCommand { get; }
        public RelayCommand ToggleThemeCommand { get; }

        public EditorViewModel()
        {
            _formatting = new FormattingSettings();
            _markdownFormatting = new FormattingSettings
            {
                FontFamily = "Segoe UI",
                FontSize = 12,
                LineHeight = 1.5
            };
            
            SaveCommand = new AsyncRelayCommand(SaveFileAsync);
            OpenCommand = new AsyncRelayCommand(OpenFileAsync);
            NewCommand = new AsyncRelayCommand(NewTextFileAsync);
            NewMarkdownCommand = new AsyncRelayCommand(NewMarkdownFileAsync);
            ResetFormattingCommand = new RelayCommand(ResetFormatting);
            ToggleThemeCommand = new RelayCommand(ToggleTheme);
            
            LoadSettings();
        }

        private async void LoadSettings()
        {
            var settings = AppSettings.Load();
            _isDarkMode = settings.IsDarkMode;
            ApplyTheme();
            
            // Restore last opened file
            if (!string.IsNullOrEmpty(settings.LastOpenedFilePath) && File.Exists(settings.LastOpenedFilePath))
            {
                try
                {
                    string fileContent = await File.ReadAllTextAsync(settings.LastOpenedFilePath);
                    _textContent = fileContent;
                    _currentFilePath = settings.LastOpenedFilePath;
                    
                    OnPropertyChanged(nameof(TextContent));
                    OnPropertyChanged(nameof(CurrentFilePath));
                    OnPropertyChanged(nameof(CurrentFileName));
                    OnPropertyChanged(nameof(CurrentFilePathTooltip));
                    UpdateFileMode();
                    HasUnsavedChanges = false;
                }
                catch
                {
                    // Ignore errors when restoring file
                }
            }
        }

        public void SaveSettings()
        {
            var settings = new AppSettings
            {
                LastOpenedFilePath = CurrentFilePath,
                IsDarkMode = IsDarkMode
            };
            settings.Save();
        }

        private void UpdateFileMode()
        {
            if (string.IsNullOrEmpty(_currentFilePath))
            {
                // Keep current mode for new files
                return;
            }
            
            var extension = Path.GetExtension(_currentFilePath)?.ToLowerInvariant();
            IsMarkdownMode = extension == ".md";
        }

        private void ToggleTheme()
        {
            IsDarkMode = !IsDarkMode;
        }

        private void ApplyTheme()
        {
            var app = System.Windows.Application.Current;
            var themeName = IsDarkMode ? "DarkTheme" : "LightTheme";
            
            var themeDict = new System.Windows.ResourceDictionary
            {
                Source = new Uri($"pack://application:,,,/Themes/{themeName}.xaml")
            };
            
            // Remove old theme and add new one
            if (app.Resources.MergedDictionaries.Count > 1)
            {
                app.Resources.MergedDictionaries.RemoveAt(app.Resources.MergedDictionaries.Count - 1);
            }
            app.Resources.MergedDictionaries.Add(themeDict);
            
            // Notify formatting changed to update text colors
            OnPropertyChanged(nameof(Formatting));
        }

        private async Task SaveFileAsync()
        {
            try
            {
                if (string.IsNullOrEmpty(CurrentFilePath))
                {
                    var defaultExt = IsMarkdownMode ? ".md" : ".txt";
                    var filter = IsMarkdownMode 
                        ? Resources.UIStrings.MarkdownFilesFilter 
                        : Resources.UIStrings.TextFilesFilter;
                    
                    var dialog = new Microsoft.Win32.SaveFileDialog
                    {
                        Filter = filter,
                        DefaultExt = defaultExt
                    };

                    if (dialog.ShowDialog() != true)
                        return;

                    CurrentFilePath = dialog.FileName;
                }

                string contentToSave = string.IsNullOrEmpty(TextContent) ? "" : TextContent;
                await File.WriteAllTextAsync(CurrentFilePath, contentToSave);
                HasUnsavedChanges = false;
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show(
                    string.Format(Resources.UIStrings.SaveErrorMessage, ex.Message), 
                    "오류");
            }
        }

        private async Task OpenFileAsync()
        {
            try
            {
                if (HasUnsavedChanges)
                {
                    var result = System.Windows.MessageBox.Show(
                        Resources.UIStrings.UnsavedChangesMessage,
                        Resources.UIStrings.UnsavedChangesTitle,
                        System.Windows.MessageBoxButton.YesNoCancel);

                    if (result == System.Windows.MessageBoxResult.Yes)
                        await SaveFileAsync();
                    else if (result == System.Windows.MessageBoxResult.Cancel)
                        return;
                }

                var dialog = new Microsoft.Win32.OpenFileDialog
                {
                    Filter = Resources.UIStrings.AllFilesFilter
                };

                if (dialog.ShowDialog() != true)
                    return;

                string fileContent = await File.ReadAllTextAsync(dialog.FileName);
                TextContent = fileContent;
                CurrentFilePath = dialog.FileName;
                HasUnsavedChanges = false;
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show(
                    string.Format(Resources.UIStrings.OpenErrorMessage, ex.Message), 
                    "오류");
            }
        }

        private async Task NewTextFileAsync()
        {
            try
            {
                if (HasUnsavedChanges)
                {
                    var result = System.Windows.MessageBox.Show(
                        Resources.UIStrings.UnsavedChangesMessage,
                        Resources.UIStrings.UnsavedChangesTitle,
                        System.Windows.MessageBoxButton.YesNoCancel);

                    if (result == System.Windows.MessageBoxResult.Yes)
                        await SaveFileAsync();
                    else if (result == System.Windows.MessageBoxResult.Cancel)
                        return;
                }

                TextContent = "";
                CurrentFilePath = null;
                IsMarkdownMode = false;
                HasUnsavedChanges = false;
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show(
                    string.Format(Resources.UIStrings.NewFileErrorMessage, ex.Message), 
                    "오류");
            }
        }

        private async Task NewMarkdownFileAsync()
        {
            try
            {
                if (HasUnsavedChanges)
                {
                    var result = System.Windows.MessageBox.Show(
                        Resources.UIStrings.UnsavedChangesMessage,
                        Resources.UIStrings.UnsavedChangesTitle,
                        System.Windows.MessageBoxButton.YesNoCancel);

                    if (result == System.Windows.MessageBoxResult.Yes)
                        await SaveFileAsync();
                    else if (result == System.Windows.MessageBoxResult.Cancel)
                        return;
                }

                TextContent = "";
                CurrentFilePath = null;
                IsMarkdownMode = true;
                HasUnsavedChanges = false;
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show(
                    string.Format(Resources.UIStrings.NewFileErrorMessage, ex.Message), 
                    "오류");
            }
        }

        private void ResetFormatting()
        {
            Formatting = new FormattingSettings();
        }
    }
}
