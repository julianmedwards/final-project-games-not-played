const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '') || 5000,
}

export default config
