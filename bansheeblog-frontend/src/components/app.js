import { h, Component } from 'preact';
import { route, Router } from 'preact-router';
import AsyncRoute from 'preact-async-route';
import Globals from '../Globals';
import { Get } from '../Fetcher';
import Header from './header';
import Articles from '../routes/articles';
import Login from '../routes/login';

import Snackbar from 'preact-material-components/Snackbar';


const loadEditor = () => import('../routes/editor').then(module => module.default);
const loadSettings = () => import('../routes/settings').then(module => module.default);

export default class App extends Component {

	constructor(props) {
		super(props);

		Globals.showSnackbar = text =>  {
			this.snackbar.MDComponent.show({
				message: text.substr(0, 180),
				actionText: '✖',
				multiline: text.length > 45,
				timeout: 1000 + text.length * 45,
				actionOnBottom: false,
				actionHandler: () => true
			});
		};
	}

	bindSnackbar = ref => this.snackbar = ref;

    load = async () => {
    	const response = await Get('/api/verify');
    	if (!response.ok) {
    		route('/admin/login');
    	}
    };

    componentDidMount() {
    	this.load();
    }

    render() {
    	return (
    		<div id="app">
    			<Header />
    			<Router>
					<Login path="/admin/login" default />
					<Articles path="/admin/" />
    				<AsyncRoute path="/admin/editor/:articleId?" getComponent={loadEditor} />
    				<AsyncRoute path="/admin/settings" getComponent={loadSettings} />
    			</Router>
    			<Snackbar dismissesOnAction ref={this.bindSnackbar} />
    		</div>
    	);
    }
}
