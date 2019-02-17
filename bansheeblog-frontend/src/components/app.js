import { h, Component } from 'preact';
import { route, Router } from 'preact-router';
import Globals from '../Globals';


import Snackbar from 'preact-material-components/Snackbar';
import 'preact-material-components/Snackbar/style.css';

import Header from './header';
import Articles from '../routes/articles';
import Editor from '../routes/editor';
import Login from '../routes/login';
import Settings from '../routes/settings';
import NotFound from '../routes/404';
import { Get } from '../Fetcher';
// import Articles from 'async!../routes/home';
// import Profile from 'async!../routes/profile';

export default class App extends Component {

	constructor(props) {
		super(props);

		Globals.showSnackbar = text =>  {
			this.snackbar.MDComponent.show({
				message: text,
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
    				<Login path="/admin/login" />

    				<Articles path="/admin/" />
    				<Editor path="/admin/editor/:articleId?" />
    				<Settings path="/admin/settings" />

    				<NotFound default />
    			</Router>

    			<Snackbar dismissesOnAction ref={this.bindSnackbar} />
    		</div>
    	);
    }
}
