import asyncPlugin from 'preact-cli-plugin-async';

export default (config, env, helpers) => {
	asyncPlugin(config);
	config.output.publicPath = '/';
	config.devServer = {
		hot: true,
		quiet: true,
		noInfo: true,
		publicPath: '/',
		historyApiFallback: true,
		proxy: [
			{
				path: '/api/**',
				target: 'http://localhost:5420'
			}
		]
	};
};