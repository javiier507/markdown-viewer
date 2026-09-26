const supportedExtension = /\.(md|markdown|mdx|txt)$/i

export const isSupportedFile = (name) => supportedExtension.test(name)
