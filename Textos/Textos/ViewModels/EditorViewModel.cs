using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Textos.Models;

namespace Textos.ViewModels
{
    public class EditorViewModel : ObservableObject
    {
        private string _textContent = "";
        private string? _currentFilePath;
        private FormattingSettings _formatting;
        private bool _hasUnsavedChanges = false;
        private bool _isDarkMode = true;
        private bool _isPageViewMode = false;
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
            set => SetProperty(ref _currentFilePath, value);
        }

        public FormattingSettings Formatting
        {
            get => _formatting;
            set => SetProperty(ref _formatting, value);
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

        public bool IsPageViewMode
        {
            get => _isPageViewMode;
            set
            {
                if (SetProperty(ref _isPageViewMode, value))
                {
                    // Force TextContent update when switching modes
                    OnPropertyChanged(nameof(TextContent));
                }
            }
        }

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
        public RelayCommand ResetFormattingCommand { get; }
        public RelayCommand ToggleThemeCommand { get; }
        public RelayCommand TogglePageViewCommand { get; }

        public EditorViewModel()
        {
            _formatting = new FormattingSettings();
            
            SaveCommand = new AsyncRelayCommand(SaveFileAsync);
            OpenCommand = new AsyncRelayCommand(OpenFileAsync);
            NewCommand = new AsyncRelayCommand(NewFileAsync);
            ResetFormattingCommand = new RelayCommand(ResetFormatting);
            ToggleThemeCommand = new RelayCommand(ToggleTheme);
            TogglePageViewCommand = new RelayCommand(TogglePageView);
            
            ApplyTheme();
        }

        private void TogglePageView()
        {
            IsPageViewMode = !IsPageViewMode;
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
                    var dialog = new Microsoft.Win32.SaveFileDialog
                    {
                        Filter = Resources.UIStrings.TextFilesFilter,
                        DefaultExt = ".txt"
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
                    Filter = Resources.UIStrings.TextFilesFilter,
                    DefaultExt = ".txt"
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

        private async Task NewFileAsync()
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
