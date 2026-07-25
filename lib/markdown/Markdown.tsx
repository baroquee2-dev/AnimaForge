import { setStringAsync } from 'expo-clipboard'
import { Image } from 'expo-image'
import { useCallback, useMemo, useState } from 'react'
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { MarkdownIt } from 'react-native-markdown-display'
import MathJax from 'react-native-mathjax-svg'
import i18n from '@lib/i18n'

import ThemedButton from '@components/buttons/ThemedButton'
import Accordion from '@components/views/Accordion'
import { getNotoFontFamilyForWeight } from '@lib/fonts/dialogueFonts'
import { ChatStyle } from '@lib/state/ChatStyle'
import { useDialogueFontsStore } from '@lib/state/DialogueFonts'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'

import latexPlugin from './MarkdownLatexPlugin'
import doubleQuotePlugin from './MarkdownQuotePlugin'
import thinkPlugin from './MarkdownThinkPlugin'

const ImageAdapter = ({
    node,
    styles,
    allowedImageHandlers,
    defaultImageHandler,
}: {
    node: any
    styles: any
    allowedImageHandlers: string[]
    defaultImageHandler: string | null
}) => {
    const [imageData, setImageData] = useState({ height: 0, aspectRatio: 1 })
    const { src, alt } = node.attributes

    const { width } = useWindowDimensions()
    const show =
        allowedImageHandlers.filter((value: string) => {
            return src.toLowerCase().startsWith(value.toLowerCase())
        }).length > 0

    if (show === false && defaultImageHandler === null) {
        return null
    }

    const imageProps: any = {
        indicator: true,
        style: styles._VIEW_SAFE_image,
        source: { uri: src },
    }

    if (alt) {
        imageProps.accessible = true
        imageProps.accessibilityLabel = alt
    }

    return (
        <View style={{ height: imageData.height }}>
            <Image
                key={node.key}
                {...imageProps}
                width={imageData.height}
                aspectRatio={imageData.aspectRatio}
                onLoad={(data) => {
                    setImageData({
                        height: Math.min(width - 100, data.source.width),
                        aspectRatio: data.source.width / data.source.height,
                    })
                }}
                contentFit="contain"
            />
        </View>
    )
}

export namespace MarkdownStyle {
    const DEFAULT_BODY_BASE_SIZE = 16
    const BODY_LINE_HEIGHT_RATIO = 1.62
    const BODY_LETTER_SPACING = 0.35

    export const Rules = MarkdownIt({ typographer: true })
        .use(thinkPlugin)
        .use(doubleQuotePlugin)
        .use(latexPlugin)

    export const RenderRules = {
        fence: (node: any, children: any, parent: any, styles: any, inheritedStyles = {}) => {
            let { content, sourceInfo } = node
            if (
                typeof node.content === 'string' &&
                node.content.charAt(node.content.length - 1) === '\n'
            ) {
                content = node.content.substring(0, node.content.length - 1)
            }
            return (
                <View key={node.key}>
                    <View style={styles.fenceHeader}>
                        <Text style={{ color: styles.fenceHeader.color }}>
                            {sourceInfo || 'Code'}
                        </Text>
                        {content && (
                            <ThemedButton
                                iconName="copy"
                                variant="tertiary"
                                iconStyle={{ color: styles.fenceHeader.color }}
                                onPress={() => {
                                    setStringAsync(content)
                                        .then(() => {
                                            Logger.infoToast(i18n.t('toast.copiedCode'))
                                        })
                                        .catch(() => {
                                            Logger.errorToast(i18n.t('toast.copyFailed'))
                                        })
                                }}
                            />
                        )}
                    </View>
                    <Text style={[inheritedStyles, styles.fence]}>{content}</Text>
                </View>
            )
        },
        double_quote: (node: any, children: any, parent: any, styles: any) => {
            const quotes = {
                english: ['\u201C', '\u201D'],
                low9: ['\u201E', '\u201D'],
                reversed9: ['\u201F', '\u201D'],
                ascii: ['"', '"'],
                guillemet: ['\u00AB', '\u00BB'],
            }

            const quoteType = (node.sourceMeta?.quoteType ??
                node.meta?.quoteType ??
                'english') as keyof typeof quotes
            let [open, close] = quotes[quoteType] || quotes.english
            if (node.sourceMeta?.dangling) close = ''
            return (
                <Text key={node.key} style={styles.double_quote}>
                    {open}
                    {children}
                    {close}
                </Text>
            )
        },
        think: (node: any, children: any, parent: any, styles: any) => {
            return (
                <Accordion
                    key={node.key}
                    label={node.sourceInfo ? 'Thought Process' : 'Thinking...'}
                    style={{
                        flex: 1,
                        marginBottom: 8,
                        elevation: 8,
                    }}>
                    {children}
                </Accordion>
            )
        },
        latex_block: (node: any, children: any, parent: any, styles: any) => {
            const { content } = node
            return (
                <MathJax
                    key={node.key}
                    style={styles.latex_block}
                    color={styles.latex_block.color ?? 'white'}>
                    {content}
                </MathJax>
            )
        },
        latex_inline: (node: any, children: any, parent: any, styles: any) => {
            const { content } = node
            return (
                <MathJax
                    key={node.key}
                    style={styles.latex_inline}
                    color={styles.latex_inline.color ?? 'white'}>
                    {content}
                </MathJax>
            )
        },
        image: (
            node: any,
            children: any,
            parent: any,
            styles: any,
            allowedImageHandlers: string[],
            defaultImageHandler: string | null
        ) => {
            return (
                <ImageAdapter
                    key={node.key}
                    node={node}
                    styles={styles}
                    allowedImageHandlers={allowedImageHandlers}
                    defaultImageHandler={defaultImageHandler}
                />
            )
        },
        inline: (node: any, children: any, parent: any, styles: any) => {
            return (
                <Text key={node.key} style={[styles.inline, { flexWrap: 'wrap', width: '100%' }]}>
                    {children}
                </Text>
            )
        },
    }

    export const useCustomFormatting = () => {
        const mdStyle = useMarkdownStyle()

        const { markdown, rules, style } = useMemo(
            () => ({
                markdown: Rules,
                rules: RenderRules,
                style: mdStyle,
            }),
            [mdStyle]
        )
        return { markdown, rules, style }
    }

    export const useMarkdownStyle = () => {
        const { color, spacing, borderRadius } = Theme.useTheme()
        const { fontSize, textWeight, dialogueFont } = ChatStyle.useChatStyle()
        const fontsReady = useDialogueFontsStore((state) => state.ready)
        const useNoto = dialogueFont === 'noto'

        const getModifiedFontSize = useCallback(
            (size: number) =>
                Math.max(ChatStyle.MIN_FONT_SIZE, ChatStyle.sizeModifierMap[fontSize] + size),
            [fontSize]
        )

        const getModifiedFontWeight = useCallback(
            (weight: number) => {
                const newWeight = Math.max(
                    200,
                    Math.min(900, weight + (ChatStyle.weightModifierMap?.[textWeight] ?? 0))
                )
                return `${newWeight}` as any
            },
            [textWeight]
        )

        const getDialogueFont = useCallback(
            (baseWeight: number) => {
                const modifiedWeight = Number(getModifiedFontWeight(baseWeight))
                if (useNoto && fontsReady) {
                    return { fontFamily: getNotoFontFamilyForWeight(modifiedWeight) }
                }
                return { fontWeight: getModifiedFontWeight(baseWeight) }
            },
            [fontsReady, useNoto, getModifiedFontWeight]
        )

        const bodyFontSize = getModifiedFontSize(DEFAULT_BODY_BASE_SIZE)
        const bodyLineHeight = Math.round(bodyFontSize * BODY_LINE_HEIGHT_RATIO)

        return useMemo(() => {
            const bodyTypography = {
                fontSize: bodyFontSize,
                lineHeight: bodyLineHeight,
                letterSpacing: BODY_LETTER_SPACING,
                ...getDialogueFont(400),
            }

            return StyleSheet.create({
                    double_quote: {
                        color: color.quote,
                        ...bodyTypography,
                    },
                    // The main container
                    body: {},

                    // Headings
                    heading1: {
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(32),
                        color: color.text._100,
                        fontWeight: getModifiedFontWeight(500),
                    },
                    heading2: {
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(24),
                        color: color.text._100,
                        fontWeight: getModifiedFontWeight(500),
                    },
                    heading3: {
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(18),
                        color: color.text._100,
                        fontWeight: getModifiedFontWeight(500),
                    },
                    heading4: {
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(16),
                        color: color.text._100,
                        fontWeight: getModifiedFontWeight(500),
                    },
                    heading5: {
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(13),
                        color: color.text._100,
                        fontWeight: getModifiedFontWeight(500),
                    },
                    heading6: {
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(11),
                        color: color.text._100,
                        fontWeight: getModifiedFontWeight(500),
                    },

                    // Horizontal Rule
                    hr: {
                        backgroundColor: color.primary._500,
                        height: 1,
                        marginTop: spacing.m,
                    },

                    // Emphasis
                    strong: {
                        ...getDialogueFont(700),
                        color: color.text._100,
                    },
                    em: {
                        fontStyle: 'italic',
                        color: color.text._400,
                    },
                    s: {
                        textDecorationLine: 'line-through',
                        color: color.text._400,
                    },

                    // Blockquotes
                    blockquote: {
                        backgroundColor: color.neutral._200,
                        borderColor: color.primary._500,
                        borderLeftWidth: 4,
                        marginLeft: spacing.sm,
                        paddingHorizontal: spacing.sm,
                        color: color.text._400,
                    },

                    // Lists
                    bullet_list: {
                        marginVertical: spacing.sm,
                    },
                    ordered_list: {
                        marginVertical: spacing.sm,
                    },
                    list_item: {
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        color: color.text._100,
                    },
                    // @pseudo class, does not have a unique render rule
                    bullet_list_icon: {
                        color: color.text._400,
                        marginLeft: spacing.m,
                        marginRight: spacing.m,
                    },
                    // @pseudo class, does not have a unique render rule
                    bullet_list_content: {
                        flex: 1,
                    },
                    // @pseudo class, does not have a unique render rule
                    ordered_list_icon: {
                        color: color.text._400,
                        marginLeft: spacing.m,
                        marginRight: spacing.m,
                    },
                    // @pseudo class, does not have a unique render rule
                    ordered_list_content: {
                        flex: 1,
                    },

                    // Code
                    code_inline: {
                        backgroundColor: color.neutral._200,
                        paddingHorizontal: spacing.m,
                        flex: 1,
                        borderRadius: 4,
                        ...Platform.select({
                            ios: {
                                fontFamily: 'Courier',
                            },
                            android: {
                                fontFamily: 'monospace',
                            },
                        }),
                    },
                    code_block: {
                        color: color.text._400,
                        borderWidth: 1,
                        borderColor: color.neutral._100,
                        backgroundColor: color.neutral._200,
                        padding: 4,
                        borderRadius: 8,
                        ...Platform.select({
                            ios: {
                                fontFamily: 'Courier',
                            },
                            android: {
                                fontFamily: 'monospace',
                            },
                        }),
                    },
                    fence: {
                        color: color.text._300,
                        backgroundColor: color.neutral._100,
                        borderColor: color.neutral._200,
                        borderWidth: 2,
                        paddingLeft: spacing.l,
                        paddingRight: spacing.l,
                        paddingVertical: spacing.m,
                        marginBottom: spacing.m,
                        borderBottomLeftRadius: borderRadius.m,
                        borderBottomRightRadius: borderRadius.m,
                        ...Platform.select({
                            ios: {
                                fontFamily: 'Courier',
                            },
                            android: {
                                fontFamily: 'monospace',
                            },
                        }),
                    },

                    fenceHeader: {
                        color: color.text._300,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                        backgroundColor: color.neutral._200,
                        borderTopLeftRadius: borderRadius.m,
                        borderTopRightRadius: borderRadius.m,
                        marginTop: spacing.sm,
                    },

                    // Tables
                    table: {
                        borderWidth: 2,
                        borderColor: color.neutral._300,
                        borderRadius: borderRadius.m,
                        marginBottom: spacing.m,
                        overflow: 'hidden',
                    },
                    thead: {
                        backgroundColor: color.neutral._300,
                    },
                    tbody: {
                        backgroundColor: color.neutral._200,
                    },
                    th: {
                        flex: 1,
                        padding: 8,
                    },
                    tr: {
                        borderBottomWidth: 1,
                        borderColor: color.neutral._300,
                        flexDirection: 'row',
                        fontSize: getModifiedFontSize(14),
                    },
                    td: {
                        flex: 1,
                        padding: 8,
                    },

                    // Links
                    link: {
                        textDecorationLine: 'underline',
                    },
                    blocklink: {
                        flex: 1,
                        borderColor: '#000000',
                        borderBottomWidth: 1,
                    },

                    // Images
                    image: {
                        flex: 1,
                        minWidth: 30,
                        minHeight: 30,
                    },

                    // Text Output
                    text: {
                        ...bodyTypography,
                    },

                    textgroup: {
                        color: color.text._100,
                        ...bodyTypography,
                    },
                    latex_inline: {
                        color: color.text._300,
                    },
                    latex_block: {
                        color: color.text._300,
                        marginTop: spacing.l,
                        marginBottom: spacing.sm,
                    },
                    paragraph: {
                        flexWrap: 'wrap',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        width: '100%',
                        color: color.text._100,
                        marginVertical: spacing.sm,
                        ...bodyTypography,
                    },

                    hardbreak: {
                        width: '100%',
                        height: 1,
                        color: color.text._100,
                    },
                    softbreak: {},

                    // Believe these are never used but retained for completeness
                    pre: {},
                    inline: {},
                    span: {},
                })
        }, [
            bodyFontSize,
            bodyLineHeight,
            color,
            spacing,
            borderRadius,
            getModifiedFontSize,
            getModifiedFontWeight,
            getDialogueFont,
        ])
    }
}
