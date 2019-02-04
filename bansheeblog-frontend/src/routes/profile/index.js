import { h, Component } from 'preact';
import Button from 'preact-material-components/Button';
import Card from 'preact-material-components/Card';
import TextField from 'preact-material-components/TextField';
import Typography from 'preact-material-components/Typography';
import 'preact-material-components/Button/style.css';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/TextField/style.css';
import 'preact-material-components/Typography/style.css';

import style from './style.css';
import linkState from "linkstate";

export default class Profile extends Component {

	state = {
		name: '',
		email: '',
		currentPassword: '',
		newPassword1: '',
		newPassword2: ''
	}
	// Note: `user` comes from the URL, courtesy of our router
	render(props, state) {
		return (
			<div class={style.home}>
				<Card class={style.card}>
                    <Typography headline4>Profile</Typography>
                    <form>
                        <TextField value={state.name} onChange={linkState(this, 'name')} class="fullwidth" label="Name" />
                        <TextField value={state.email} onChange={linkState(this, 'email')} class="fullwidth" label="Email" />
                        <Button>Save changes</Button>
                    </form>

					<Typography headline6>Change your admin password</Typography>
					<form>
						<TextField value={state.currentPassword} onChange={linkState(this, 'currentPassword')} class="fullwidth" label="Current password" />
						<TextField value={state.newPassword1} onChange={linkState(this, 'newPassword1')} class="fullwidth" label="New password" />
						<TextField value={state.newPassword2} onChange={linkState(this, 'newPassword2')} class="fullwidth" label="Repeat new password" />
						<Button>Change password</Button>
					</form>
				</Card>
			</div>
		);
	}
}
