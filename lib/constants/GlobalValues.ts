export const enum Global {
    CpuFeatures = 'cpufeatures',
    CPUThreads = 'constants-cpu-threads',
}

export enum AppSettings {
    DevMode = 'devmode',
    DarkMode = 'darkmode',
    AnimateEditor = 'animateeditor',
    CreateFirstMes = 'createfirstmes',
    ChatOnStartup = 'chatonstartup',
    AutoLoadLocal = 'autoloadlocal',
    AutoScroll = 'autoscroll',
    SendOnEnter = 'sendonenter',
    SaveLocalKV = 'savelocalkv',
    PrintContext = 'printcontext',
    CreateDefaultCard = 'createdefaultcard',
    BypassContextLength = 'bypasscontextlength',
    NotifyOnComplete = 'notifyOnComplete',
    PlayNotificationSound = 'notifySound',
    VibrateNotification = 'notifyvibrate',
    ShowNotificationText = 'shownotificationtext',
    LocallyAuthenticateUser = 'localauthuser',
    ShowModelInChat = 'showmodelinchat',
    ShowTags = 'showtags',
    UseModelTemplate = 'useModelTemplate',
    ShowTokenPerSecond = 'showtokenpersecond',
    AutoLoadUser = 'autoloaduser',
    UseTagHider = 'settings-usetaghider',
    SaveScrollPosition = 'settings-savescrollposition',
    AutoGenerateTitle = 'settings-auto-generate-title',
    KeepAwake = 'settings-keep-awake',
    AutoSummary = 'settings-auto-summary',
    AutoExtractKeyFacts = 'settings-auto-extract-key-facts',
}

/**
 * Default settings on first install
 */
export const AppSettingsDefault: Record<AppSettings, boolean> = {
    [AppSettings.AnimateEditor]: true,
    [AppSettings.AutoLoadLocal]: false,
    [AppSettings.AutoScroll]: true,
    [AppSettings.ChatOnStartup]: false,
    [AppSettings.CreateFirstMes]: true,
    [AppSettings.DarkMode]: true,
    [AppSettings.DevMode]: false,
    [AppSettings.SendOnEnter]: false,
    [AppSettings.SaveLocalKV]: false,
    [AppSettings.PrintContext]: false,
    [AppSettings.CreateDefaultCard]: true,
    [AppSettings.BypassContextLength]: false,
    [AppSettings.NotifyOnComplete]: false,
    [AppSettings.PlayNotificationSound]: false,
    [AppSettings.VibrateNotification]: false,
    [AppSettings.LocallyAuthenticateUser]: false,
    [AppSettings.ShowNotificationText]: false,
    [AppSettings.ShowModelInChat]: false,
    [AppSettings.ShowTags]: false,
    [AppSettings.UseModelTemplate]: true,
    [AppSettings.ShowTokenPerSecond]: true,
    [AppSettings.AutoLoadUser]: true,
    [AppSettings.UseTagHider]: true,
    [AppSettings.SaveScrollPosition]: false,
    [AppSettings.AutoGenerateTitle]: true,
    [AppSettings.KeepAwake]: true,
    [AppSettings.AutoSummary]: false,
    [AppSettings.AutoExtractKeyFacts]: false,
}

export const CLAUDE_VERSION = '2023-06-01'

export const GITHUB_REPOSITORY = 'https://github.com/baroquee2-dev/MiseChat'
export const GITHUB_REPOSITORY_ISSUES = `${GITHUB_REPOSITORY}/issues`
export const GITHUB_DOCS_CUSTOM_TEMPLATES = `${GITHUB_REPOSITORY}/blob/dev/docs/CustomTemplates.md`
export const GITHUB_DOCS_CUSTOM_THEMES = `${GITHUB_REPOSITORY}/blob/dev/docs/CustomThemes.md`

export const APP_NAME = 'MiseChat'
export const APP_SCHEME = 'misechat'
export const APP_PACKAGE = 'com.baroquee2.misechat'
export const APP_PACKAGE_DEV = 'com.baroquee2.misechat.dev'
