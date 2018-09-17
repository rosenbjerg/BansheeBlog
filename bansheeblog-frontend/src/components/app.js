import { h, Component } from 'preact';
import { route, Router } from 'preact-router';

import Header from './header';
import Articles from '../routes/articles';
import Login from '../routes/login';
import Profile from '../routes/profile';
import NotFound from '../routes/404';
import { Get } from '../Fetcher';
// import Articles from 'async!../routes/home';
// import Profile from 'async!../routes/profile';

export default class App extends Component {

	load = async () => {
    	const response = await Get('/api/verify');
    	if (response.ok) {
    		route('/');
    	}
    };

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
    		</div>
    	);
    }
}
