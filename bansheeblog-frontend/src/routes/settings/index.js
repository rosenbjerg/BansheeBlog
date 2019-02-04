import { h, Component } from 'preact';
import Markup from 'preact-markup';
import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';

import Button from 'preact-material-components/Button';
import TextField from 'preact-material-components/TextField';
import Switch from 'preact-material-components/Switch';
import 'preact-material-components/Switch/style.css';
import 'preact-material-components/Dialog/style.css';
import 'preact-material-components/Icon/style.css';
import 'preact-material-components/Typography/style.css';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import 'preact-material-components/TextField/style.css';
import style from './style.css';
import { Delete, Get, Post } from '../../Fetcher';
import { route } from 'preact-router';
import Globals from '../../Globals';

import Select from 'preact-material-components/Select';
import 'preact-material-components/List/style.css';
import 'preact-material-components/Menu/style.css';
import 'preact-material-components/Select/style.css';
import linkState from 'linkstate';

export default class Settings extends Component {

	state = {
		settings: {},
		themes: [],
		currentPassword: '',
		newPassword1: ''
	};

	articleToDelete = undefined;

	load = async () => {
		const requests = [
			Get('/api/settings').then(res => res.json()),
			Get('/api/themes').then(res => res.json())
		];

		const responses = await Promise.all(requests);
		const settings = responses[0];
		const themes = responses[1];

		console.log('settings', settings);
		console.log('themes', themes);
		this.setState({ settings, themes });
	};

	bindManageThemesDialog = ref => this.uploadThemeDialog = ref;
	bindUploadThemeForm = ref => this.uploadThemeForm = ref;

	save = async () => {
		const reponse = await Post('/api/settings', this.state.settings);
		if (reponse.ok) {
			Globals.showSnackbar('Settings has been saved');
		}
	};

	componentDidMount() {
		this.load();
	}

	async componentWillUnmount() {
		await this.save();
	}

	themeChanged = ev => {
		const selected = this.state.themes[ev.target.selectedIndex - 1]; 
		this.setState(s => s.settings.ActiveTheme = selected);
	};
	openManageThemeDialog = () => this.uploadThemeDialog.MDComponent.show();

	render(props, state) {
		return (
			<div class={style.home}>
				<Card class={style.card}>
					<Typography headline4>Settings</Typography>

					<Typography headline6>Blog info</Typography>
					<TextField className="fullwidth" label="Author" value={state.settings.Author} onChange={linkState(this, 'settings.Author')} />
					<TextField className="fullwidth" label="Blog title" value={state.settings.BlogTitle} onChange={linkState(this, 'settings.BlogTitle')} />
					<TextField className="fullwidth" label="Blog description" value={state.settings.BlogDescription} onChange={linkState(this, 'settings.BlogDescription')} />

					<Typography headline6>Analytics</Typography>
					<TextField className="fullwidth" label="Google Analytics Tracking ID" value={state.settings.GoogleAnalyticsTrackingId} onChange={linkState(this, 'settings.GoogleAnalyticsTrackingId')} />
					<div style={{ margin: '8px 0 8px 4px' }}>
						<Typography style={{ 'margin-right': '10px' }} body1>Use server-side tracking to monitor visits</Typography>
						<Switch checked={state.settings.UseServerSideTracking} onChange={linkState(this, 'settings.UseServerSideTracking')} />
					</div>

					<Typography headline6>Themes</Typography>
					<Select hintText="Blog theme"
						selectedIndex={state.themes.indexOf(state.settings.ActiveTheme) + 1}
						onInput={this.themeChanged}
					>
						{state.themes.map(theme => <Select.Item>{theme}</Select.Item>)}
					</Select>

					<Button onClick={this.openManageThemeDialog}>Manage blog themes</Button>
					{/*<Button onClick={this.save}>Save blog settings</Button>*/}


					<Typography headline6>Change your admin password</Typography>
					<form>
						<TextField value={state.currentPassword} onChange={linkState(this, 'currentPassword')} class="fullwidth" label="Current password" />
						<TextField value={state.newPassword1} onChange={linkState(this, 'newPassword1')} class="fullwidth" label="New password" />
						<TextField value={state.newPassword2} onChange={linkState(this, 'newPassword2')} class="fullwidth" label="Repeat new password" />
						<Button class="fullwidth">Change password</Button>
					</form>

				</Card>

				<Dialog ref={this.bindManageThemesDialog}>
					<Dialog.Header>Manage blog themes</Dialog.Header>
					<Dialog.Body>
						<Typography>Currently installed themes</Typography>
						<ul>
							{state.themes.map(theme => (
								<li key={theme}>
									<Typography headline6>{theme}</Typography>
									{theme !== 'default' && <Icon>delete_permanently</Icon>}
								</li>
							))}
						</ul>

						<br />
						<Typography>Upload more themes</Typography>
						<form ref={this.bindUploadThemeForm}>
							<div>
								<input type="file" accept=".zip" />
							</div>
							<Button type="submit">Upload</Button>
						</form>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.FooterButton accept>Done</Dialog.FooterButton>
					</Dialog.Footer>
				</Dialog>
			</div>
		);
	}
}
