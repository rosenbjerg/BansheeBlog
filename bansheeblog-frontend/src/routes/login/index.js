import { h, Component } from 'preact';
import { route } from 'preact-router';
import { Get, Post } from '../../Fetcher';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import TextField from 'preact-material-components/TextField';

import style from './style.css';

const loginStyle = {
	'max-width': 600,
	margin: 'auto',
	'margin-top': '10vh',
	padding: 10
};


export default class Login extends Component {

    login = async ev => {
    	ev.preventDefault();
    	const formdata = new FormData(ev.target);
    	const response = await Post('/api/login', formdata, false);
    	ev.target.reset();
    	if (response.ok) {
    		route('/admin/');
    	}
    };

    checkLoggedIn = async () => {
		const response = await Get('/api/verify');
		if (response.ok) route('/admin/', true);
	};

    componentDidMount() {
		this.checkLoggedIn();
	}

	render(props, state) {
    	return (
    		<div className={style.home}>
    			<Card style={loginStyle}>
    				<Typography headline4>Admin login</Typography>
    				<form onSubmit={this.login}>
    					<div>
    						<TextField className="fullwidth" label="Username" name="username" required />
    					</div>
    					<div>
    						<TextField className="fullwidth" label="Password" name="password" type="password" required />
    					</div>
    					<Card.Actions>
    						<Card.ActionButton type="submit">Login</Card.ActionButton>
    					</Card.Actions>
    				</form>
    			</Card>
    		</div>
    	);
    }
}
