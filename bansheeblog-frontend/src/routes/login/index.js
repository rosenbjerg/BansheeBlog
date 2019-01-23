import { h, Component } from 'preact';
import linkState from 'linkstate';

import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import 'preact-material-components/FormField/style.css';
import Typography from 'preact-material-components/Typography';
import FormField from 'preact-material-components/FormField';
import 'preact-material-components/Typography/style.css';
import { Get, Post } from '../../Fetcher';
import { route } from 'preact-router';
import TextField from 'preact-material-components/TextField';
import 'preact-material-components/TextField/style.css';

import style from './style.css';

const cardStyle = {
	margin: 10
};
const loginStyle = {
	'max-width': 600,
	margin: 'auto',
	'margin-top': '10vh',
	padding: 10
};


export default class Articles extends Component {

    login = async ev => {
    	ev.preventDefault();
    	const formdata = new FormData(ev.target);
    	const response = await Post('/api/login', formdata, false);
    	ev.target.reset();
    	if (response.ok) {
    		console.log('logged in');
    		route('/admin/');
    	}
    };


    render() {
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
