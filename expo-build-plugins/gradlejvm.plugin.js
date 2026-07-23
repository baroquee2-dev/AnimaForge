const { withGradleProperties } = require('expo/config-plugins')

const GRADLE_JVMARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError'

module.exports = function withGradleJvmArgs(config) {
    return withGradleProperties(config, (config) => {
        const properties = config.modResults.filter(
            (item) => !(item.type === 'property' && item.key === 'org.gradle.jvmargs')
        )

        properties.push({
            type: 'property',
            key: 'org.gradle.jvmargs',
            value: GRADLE_JVMARGS,
        })

        config.modResults = properties
        return config
    })
}
