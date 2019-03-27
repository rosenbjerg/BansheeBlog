import { Post } from '../../../Fetcher';
import Globals from '../../../Globals';
import style from '../style.css';
import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Button from 'preact-material-components/Button';
import TextField from 'preact-material-components/TextField';

const submitPasswordChange = async ev => {
	ev.preventDefault();
	const formData = new FormData(ev.target);
	if (formData.newPassword1 !== formData.newPassword2){
		Globals.showSnackbar('The two password are not the same');
		return;
	}
	const response = await Post('/api/changepassword', formData, false);
	if (response.ok){
		Globals.showSnackbar('Password has been changed');
	}
	else {
		Globals.showSnackbar('Could not change the password');
	}
	ev.target.reset();
};

const ChangePasswordTile = (props) => (
	<span>
		<Card class={[style.card, style.fiveBlock].join(' ')}>
			<Typography headline6>Change your admin password</Typography>
			<form onSubmit={submitPasswordChange}>
				<TextField name="oldPassword"  class="fullwidth" label="Current password" required />
				<TextField name="newPassword1" class="fullwidth" label="New password" required minLength="8" maxLength="60" />
				<TextField name="newPassword2" class="fullwidth" label="Repeat new password" required minLength="8" maxLength="60" />
				<Button type="submit" class="fullwidth">Change password</Button>
			</form>
		</Card>
	</span>
);
export default ChangePasswordTile;