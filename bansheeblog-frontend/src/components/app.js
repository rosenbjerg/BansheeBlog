import { h, Component } from 'preact';
import { route, Router } from 'preact-router';
import Globals from '../Globals';


import Snackbar from 'preact-material-components/Snackbar';
import 'preact-material-components/Snackbar/style.css';

import Header from './header';
import Articles from '../routes/articles';
import Login from '../routes/login';
import Profile from '../routes/profile';
import NotFound from '../routes/404';
import { Get } from '../Fetcher';
// import Articles from 'async!../routes/home';
// import Profile from 'async!../routes/profile';

export default class App extends Component {

	constructor(props) {
		super(props);

		Globals.showSnackbar = text => setTimeout(() => {
			this.snackbar.MDComponent.show({
				message: text,
				actionText: '✖',
				multiline: text.length > 45,
				timeout: 1000 + text.length * 45,
				actionOnBottom: false,
				actionHandler: () => true
			});
		}, 0);
	}

	bindSnackbar = ref => this.snackbar = ref;

    load = async () => {
    	const response = await Get('/api/verify');
    	if (!response.ok) {
    		route('/login');
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
    				<Login path="/login" />

    				<Articles path="/" />

    				<Profile path="/profile/" user="me" />
    				<Profile path="/profile/:user" />
    				<NotFound default />
    			</Router>

    			<Snackbar dismissesOnAction ref={this.bindSnackbar} />
    		</div>
    	);
    }
}
