import { h, Component } from 'preact';
import { Delete, Get, Post } from '../../../Fetcher';
import Globals from '../../../Globals';
import Upload from '../../../components/upload';
import style from '../style.css';
import remove from 'lodash/remove';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';
import Button from 'preact-material-components/Button';
import Select from 'preact-material-components/Select';

export default class ThemeTile extends Component {

    state = {
    	themes: [],
		current: this.props.current
    };

    loadThemes = async () => {
    	let themes = await Get('/api/themes').then(res => res.json());
		themes.sort();
		themes = themes.map(name => ({ name, remove: this.openDeleteDialog(name) }));
		console.log("THEMES", themes);
    	this.setState({ themes });
    };

    bindDeleteDialog = ref => this.deleteDialog = ref;
    bindManageDialog = ref => this.uploadThemeDialog = ref;

    submitThemeUpload = async ev => {
    	ev.preventDefault();
    	const formData = new FormData(ev.target);
    	const response = await Post('/api/theme', formData, false);

    	if (response.ok){
    		let themes = await response.json();
			themes.sort();
			themes = themes.map(name => ({ name, remove: this.openDeleteDialog(name) }));
    		this.setState({ themes });
    		ev.target.reset();
    	}
    	else {
    		Globals.showSnackbar('Could not upload theme');
    	}

    };

    themeChanged = ev => {
    	const selected = this.state.themes[ev.target.selectedIndex - 1].name;
    	this.props.activeChanged(selected);
    	this.setState({current: selected});
    };


    openManageDialog = () => {
		this.loadThemes();
    	this.uploadThemeDialog.MDComponent.show();
	};

    openDeleteDialog = name => () => {
    	this.setState({ toDelete: name });
    	this.deleteDialog.MDComponent.show();
    };

    deleteTheme = async () => {
    	const name = this.state.toDelete;
    	const response = await Delete(`/api/theme`, name, false);
    	if (response.ok) {
    		Globals.showSnackbar(`The theme has been deleted`);
    		this.setState(state => {
				remove(state.themes, theme => theme.name === name);
    		});
    	}
    };
    findActiveThemeIndex = t => this.state.current && (this.state.current === t.name);

    render(props, state) {
    	return (
    		<span>
    			<Card class={[style.card, style.oneBlock].join(' ')}>
					<Typography headline6>Themes</Typography>
					<Icon class="hoverIcon right" onClick={this.openManageDialog} title="Manage blog themes">open_in_new</Icon>
				</Card>

    			<Dialog ref={this.bindManageDialog}>
    				<Dialog.Header>Manage blog themes</Dialog.Header>

    				<Dialog.Body>
    					<Typography>Current theme</Typography>
						<div>
							<Select class="fullwidth" hintText="Blog theme" selectedIndex={state.themes.findIndex(this.findActiveThemeIndex) + 1} onInput={this.themeChanged}>
								{state.themes.map(theme => (
									<Select.Item key={theme.name}>{theme.name}</Select.Item>
								))}
							</Select>
						</div>

						<br />
    					<Typography>Currently installed themes</Typography>
    					<table class="fullwidth striped">
    						{state.themes.map(theme => (
    							<tr key={theme}>
    								<td>
    									<Typography headline6>{theme.name}</Typography>
    								</td>
    								<td>
    									{theme.name !== 'default' && <Icon class="hoverIcon" onClick={theme.remove} title="Delete theme">delete_permanently</Icon>}
    								</td>
    							</tr>
    						))}
    					</table>
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

    			<Dialog ref={this.bindDeleteDialog} onAccept={this.deleteTheme}>
    				<Dialog.Header>Delete {state.toDeleteType}?</Dialog.Header>
    				<Dialog.Body>
    					<Typography body1>Are you sure you want to delete {state.toDelete}?</Typography>
    				</Dialog.Body>
    				<Dialog.Footer>
    					<Dialog.FooterButton accept>Yes</Dialog.FooterButton>
    					<Dialog.FooterButton cancel primary>No</Dialog.FooterButton>
    				</Dialog.Footer>
    			</Dialog>

    		</span>
    	);
    }
}
