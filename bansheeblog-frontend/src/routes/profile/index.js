import { h, Component } from 'preact';
import Button from 'preact-material-components/Button';
import 'preact-material-components/Button/style.css';
import style from './style';
import TextField from 'preact-material-components/TextField';
import 'preact-material-components/TextField/style.css';
import TabBar from 'preact-material-components/TabBar';
import Typography from 'preact-material-components/Typography';
import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';

export default class Profile extends Component {
	state = {
		time: Date.now(),
		count: 10
	};


	// Note: `user` comes from the URL, courtesy of our router
	render(props, state) {
		return (
			<div class={style.home}>
				<Card class={style.card}>
					<Typography headline4>Profile</Typography>
					<TextField class="fullwidth" label="Name" />
					<TextField class="fullwidth" label="Email" />

					<Typography headline6>Change your admin password</Typography>
					<form>
						<TextField class="fullwidth" label="Password" />
						<TextField class="fullwidth" label="Repeat password" />
						<Button>Change password</Button>
					</form>
				</Card>
			</div>
		);
	}
}
