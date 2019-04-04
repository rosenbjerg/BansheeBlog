import { h, Component } from 'preact';
import isEqual from 'lodash/isEqual';
import linkState from 'linkstate';
import { Get, Post } from '../../Fetcher';
import Globals from '../../Globals';
import style from './style.css';
import cloneDeep from 'lodash/cloneDeep'

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Select from 'preact-material-components/Select';
import Icon from 'preact-material-components/Icon';
import TextField from 'preact-material-components/TextField';
import StaticFilesTile from "./staticFilesTile";
import UpdateTile from "./updateTile";
import ThemeTile from "./themeTile";
import AnalyticsTile from "./analyticsTile";
import ChangePasswordTile from "./changePasswordTile";
import NavigationTile from "./navigationTile";
import pull from 'lodash/pull';

export default class Settings extends Component {

    state = {
    	settings: {},
    	themes: [],
		timezones: [],
		currentTimezoneIndex: -1
    };

    load = async () => {
    	const settings = await Get('/api/settings').then(res => res.json());
    	const timezones = await Get('/api/settings/timezones').then(res => res.json());
    	const currentTimezoneIndex = timezones.indexOf(settings.Timezone) + 1;
    	this.setState({ settings, timezones, currentTimezoneIndex });
    	this.savedSettings = cloneDeep(settings);
    };

    save = async () => {
    	if (!isEqual(this.savedSettings, this.state.settings)){
    		const response = await Post('/api/settings', this.state.settings);
    		if (response.ok) {
    			Globals.showSnackbar('Settings has been saved');
				this.savedSettings = cloneDeep(this.state.settings);
    		}
    	}
    };

    componentDidMount() {
    	this.load();
    }

    componentWillUnmount() {
    	this.save();
    }

	timezoneChanged = ev => {
    	const selectedIndex = ev.target.selectedIndex;
		const timezone = this.state.timezones[selectedIndex - 1];
		this.setState(state => {
			state.settings.Timezone = timezone;
			state.currentTimezoneIndex = selectedIndex;
		});
	};
    activeThemeSet = theme =>  this.setState(state => state.settings.ActiveTheme = theme);
    removeNavItem = nav => () => {
    	this.setState(state => pull(state.settings.Navigation, nav));
    };
    addNavItem = navItem => {
    	this.setState(state => state.settings.Navigation.push(navItem));
    };


    render(props, state) {
    	return (
    		<div class={style.home}>
    			<Typography headline4>
                    Settings
    				<Icon class="hoverIcon" onClick={this.save}>save</Icon>
    			</Typography>

    			<br />

    			<Card class={[style.card, style.fiveBlock].join(' ')}>
    				<Typography headline6>Blog info</Typography>
    				<TextField className="fullwidth" label="Author" value={state.settings.Author} onChange={linkState(this, 'settings.Author')} />
    				<TextField className="fullwidth" label="Blog title" value={state.settings.BlogTitle} onChange={linkState(this, 'settings.BlogTitle')} />
    				<TextField className="fullwidth" label="Blog description" value={state.settings.BlogDescription} onChange={linkState(this, 'settings.BlogDescription')} />
					<Select class="fullwidth" hintText="Timezone" selectedIndex={state.currentTimezoneIndex} onChanged={this.timezoneChanged}>
						{state.timezones.map(timezone => (
							<Select.Item key={timezone}>{timezone}</Select.Item>
						))}
					</Select>
    			</Card>


				<AnalyticsTile serverSideTracking={state.settings.UseServerSideTracking}
							   googleAnalytics={state.settings.GoogleAnalyticsTrackingId}
							   onServerSideTrackingChanged={linkState(this, 'settings.UseServerSideTracking')}
							   onGoogleAnalyticsChanged={linkState(this, 'settings.GoogleAnalyticsTrackingId')} />

				<StaticFilesTile/>

				<NavigationTile items={state.settings.Navigation} itemAdded={this.addNavItem} itemRemoved={this.removeNavItem} />

				<UpdateTile />

				<ThemeTile current={state.settings.ActiveTheme} activeChanged={this.activeThemeSet} />

				<ChangePasswordTile />

    		</div>
    	);
    }
}
