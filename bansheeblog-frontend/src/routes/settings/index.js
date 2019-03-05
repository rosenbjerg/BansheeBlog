/* eslint-disable no-mixed-spaces-and-tabs */
import { h, Component } from 'preact';
import isEqual from 'lodash/isEqual';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import copy from 'clipboard-copy';
import linkState from 'linkstate';
import { Delete, Get, Post } from '../../Fetcher';
import Globals from '../../Globals';
import Upload from '../../components/upload';
import style from './style.css';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import FormField from 'preact-material-components/FormField';
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

import Select from 'preact-material-components/Select';
import 'preact-material-components/List/style.css';
import 'preact-material-components/Menu/style.css';
import 'preact-material-components/Select/style.css';
import 'preact-material-components/FormField/style.css';


export default class Settings extends Component {

	state = {
		settings: {},
		themes: [],
		files: [],
		stats: [],
		presentedStats: {},
		currentPassword: '',
		newPassword1: '',
		unzipPublicFile: false,
		showUnzipPublicFile: false,
		selectedFiles: []
	};

    prepareFiles = files => {
    	files.sort();
    	const port = location.port === 80 ? '' : ':' + location.port;
    	const url = `${location.protocol}//${location.hostname}${port}/static/`;
    	return files.map(f => ({
    		name: f,
    		copyLink: () => copy(url + f),
    		remove: this.openDeleteDialog('file', f)
    	}));
    };

	load = async () => {
		const requests = [
			Get('/api/settings').then(res => res.json()),
			Get('/api/themes').then(res => res.json())
		];

		const responses = await Promise.all(requests);
		const settings = responses[0];
		const themes = responses[1].map(name => ({ name, remove: this.openDeleteDialog('theme', name) }));

		this.initialSettings = { ...settings };
		this.setState({ settings, themes });
	};

	bindDeleteDialog = ref => this.deleteDialog = ref;
	bindAnalyticsDialog = ref => this.analyticsDialog = ref;
	bindManageThemesDialog = ref => this.uploadThemeDialog = ref;
    bindManagePublicFilesDialog = ref => this.managePublicFilesForm = ref;

    submitThemeUpload = async ev => {
    	ev.preventDefault();
    	const formData = new FormData(ev.target);
    	const response = await Post('/api/theme', formData, false);

    	if (response.ok){
    		const themes = await response.json();
    		this.setState({ themes: themes.map(name => ({ name, remove: this.openDeleteDialog('theme', name) })) });
    		ev.target.reset();
    	}
    	else {
    		Globals.showSnackbar('Could not upload theme');
    	}

    };
    submitStaticFileUpload = async ev => {
    	ev.preventDefault();
    	const formData = new FormData(ev.target);
    	formData.append('unzip', this.state.showUnzipPublicFile && this.state.unzipPublicFile);
    	const response = await Post('/api/file', formData, false);

    	if (response.ok){
    		const files = this.prepareFiles(await response.json());
    		this.setState({
    			files,
    			selectedFiles: [],
    			unzipPublicFile: false,
    			showUnzipPublicFile: false });
    		ev.target.reset();
    	}
    	else {
    		Globals.showSnackbar('Could not upload file');
    	}

    };
    submitPasswordChange = async ev => {
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

	save = async () => {
		const response = await Post('/api/settings', this.state.settings);
		if (response.ok) {
			Globals.showSnackbar('Settings has been saved');
		}
	};

	componentDidMount() {
		this.load();
	}

	componentWillUnmount() {
		if (!isEqual(this.initialSettings, this.state.settings)){
			this.save();
		}
	}

	themeChanged = ev => {
		const selected = this.state.themes[ev.target.selectedIndex - 1];
		this.setState(s => s.settings.ActiveTheme = selected);
	};
	openAnalyticsDialog = async () => {
		const statsTask = Get('/api/visits/latest-month').then(res => res.json());
		this.analyticsDialog.MDComponent.show();
		const stats = await statsTask;
		const presentedStats = this.groupAnalyticsStats('Page');
		this.setState({ stats, presentedStats });
	};
	openThemeDialog = () => this.uploadThemeDialog.MDComponent.show();
    openStaticFileDialog = () => {
    	Get('/api/files')
    		.then(res => res.json())
    		.then(this.prepareFiles)
    		.then(files => this.setState({ files }));

    	this.managePublicFilesForm.MDComponent.show();
    };

    openDeleteDialog = (type, name) => () => {
    	this.setState({
    		toDeleteType: type,
    		toDelete: name
    	});
    	this.deleteDialog.MDComponent.show();
    };
    deleteThemeOrFile = async () => {
    	const type = this.state.toDeleteType;
    	const name = this.state.toDelete;
    	const reponse = await Delete(`/api/${type}`, name, false);
    	if (reponse.ok) {
    		Globals.showSnackbar(`The ${type} has been deleted`);
    		this.setState(s => {
    			const collection = s[type + 's'];
    			collection.splice(collection.indexOf(name));
    		});
    	}
    };
	findActiveThemeIndex = t => this.state.settings.ActiveTheme === t.name;

	changeAnalyticsGrouping = ev => this.setState({ presentedStats: this.groupAnalyticsStats(ev.target.dataset.grouping) });
	groupAnalyticsStats = prop => {
		let presentedStats = groupBy([...this.state.stats], prop);
		presentedStats = orderBy(presentedStats, ['length'], ['desc']);
		presentedStats = presentedStats.reduce((acc, s) => {acc[s[0][prop]] = s; return acc;}, {});
		return presentedStats;
	};

    onStaticFileSelected = files => {
    	this.setState({
    		showUnzipPublicFile: files.findIndex(file => file.name.toLowerCase().endsWith('.zip')) > -1,
    		selectedFiles: files
    	});
    };

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
    				<Button onClick={this.openAnalyticsDialog}>View analytics</Button>

    				<Typography headline6>Themes</Typography>
    				<Select hintText="Blog theme" selectedIndex={state.themes.findIndex(this.findActiveThemeIndex) + 1} onInput={this.themeChanged}>
    					{state.themes.map(theme => <Select.Item>{theme.name}</Select.Item>)}
    				</Select>
    				<Button onClick={this.openThemeDialog}>Manage blog themes</Button>

    				<Typography headline6>Public files</Typography>
    				<Button onClick={this.openStaticFileDialog}>Manage public files</Button>

    				<Typography headline6>Change your admin password</Typography>
    				<form onSubmit={this.submitPasswordChange}>
    					<TextField name="oldPassword"  class="fullwidth" label="Current password" required />
    					<TextField name="newPassword1" class="fullwidth" label="New password" required minLength="8" maxLength="60" />
    					<TextField name="newPassword2" class="fullwidth" label="Repeat new password" required minLength="8" maxLength="60" />
    					<Button type="submit" class="fullwidth">Change password</Button>
    				</form>

    			</Card>

    			<Dialog ref={this.bindAnalyticsDialog}>
    				<Dialog.Header>Analytics</Dialog.Header>
    				<Dialog.Body>
    					{!state.settings.UseServerSideTracking && (
    						<div style={{ 'background-color': 'rgba(224,224,224,0.5)', 'padding-left': '2px' }}>
    							<Typography caption>Server-side tracking is currently disabled</Typography>
    						</div>
    					)}
    					<Typography body1>Stats for the latest month</Typography>
    					<div>
    						<Typography body2>Group by</Typography>
    					</div>
    					<button class={style.groupbutton} data-grouping="Page" onClick={this.changeAnalyticsGrouping}>Visited page</button>
    					<button class={style.groupbutton} data-grouping="OS" onClick={this.changeAnalyticsGrouping}>Operating System</button>
    					<button class={style.groupbutton} data-grouping="UserAgent" onClick={this.changeAnalyticsGrouping}>User-agent</button>
    					<button class={style.groupbutton} data-grouping="Device" onClick={this.changeAnalyticsGrouping}>Device used</button>
    					<ul>
    						{Object.keys(state.presentedStats).map(page => {
    							const pageStats = state.presentedStats[page];
    							return (
    								<li>
    									<Typography body2><b>{page}</b>: {pageStats.length} visits</Typography>
    								</li>
    							);
    						})}
    					</ul>

    				</Dialog.Body>
    				<Dialog.Footer>
    					<Dialog.FooterButton accept>Done</Dialog.FooterButton>
    				</Dialog.Footer>
    			</Dialog>

    			<Dialog ref={this.bindManageThemesDialog}>
    				<Dialog.Header>Manage blog themes</Dialog.Header>
    				<Dialog.Body>
    					<Typography>Currently installed themes</Typography>
    					<ul>
    						{state.themes.map(theme => (
    							<li key={theme}>
    								<FormField>
    									<Typography headline6>{theme.name}</Typography>
    									{theme.name !== 'default' && <Icon class="hoverIcon" onClick={theme.remove}>delete_permanently</Icon>}
    								</FormField>
    							</li>
    						))}
    					</ul>
    					<br />
    					<Typography>Upload more themes</Typography>
    					<form onSubmit={this.submitThemeUpload}>
    						<div>
    							<Upload name="theme" accept=".zip" required />
    						</div>
    						<Button type="submit">Upload</Button>
    					</form>
    				</Dialog.Body>
    				<Dialog.Footer>
    					<Dialog.FooterButton accept>Done</Dialog.FooterButton>
    				</Dialog.Footer>
    			</Dialog>


    			<Dialog ref={this.bindManagePublicFilesDialog}>
    				<Dialog.Header>Manage static files</Dialog.Header>
    				<Dialog.Body>
    					<Typography>All files</Typography>
    					<ul className={style.fileList}>
    						{state.files.map(file => (
    							<li key={file.name} className={style.files}>
    								<FormField>
    									<Typography body1>{file.name}</Typography>
    									<Icon class="hoverIcon" onClick={file.copyLink}>insert_link</Icon>
    									<Icon class="hoverIcon" onClick={file.remove}>delete_permanently</Icon>
    								</FormField>
    							</li>
    						))}
    					</ul>

    					<br />
    					<Typography>Upload more files</Typography>
    					<form onSubmit={this.submitStaticFileUpload}>
    						<div>
    							{/*<input name="files" onChange={this.onPublicFileToUploadSelected} type="file" required multiple />*/}
    							<Upload name="files" selected={state.selectedFiles} onChange={this.onStaticFileSelected} required multiple />
    						</div>
    						<Button type="submit">Upload</Button>
    						{state.showUnzipPublicFile && (
    							<div style={{ margin: '8px 0 8px 4px' }}>
    								<Typography style={{ 'margin-right': '10px' }} body1>Unzip file(s)?</Typography>
    								<Switch checked={state.unzipPublicFile} onChange={linkState(this, 'unzipPublicFile')} />
    							</div>
    						)}
    					</form>
    				</Dialog.Body>
    				<Dialog.Footer>
    					<Dialog.FooterButton accept>Done</Dialog.FooterButton>
    				</Dialog.Footer>
    			</Dialog>


    			<Dialog ref={this.bindDeleteDialog} onAccept={this.deleteThemeOrFile}>
    				<Dialog.Header>Delete {state.toDeleteType}?</Dialog.Header>
    				<Dialog.Body>
    					<Typography body1>Are you sure you want to delete {state.toDelete}?</Typography>
    				</Dialog.Body>
    				<Dialog.Footer>
    					<Dialog.FooterButton accept>Yes</Dialog.FooterButton>
    					<Dialog.FooterButton cancel primary>No</Dialog.FooterButton>
    				</Dialog.Footer>
    			</Dialog>

    		</div>
    	);

    }
}
