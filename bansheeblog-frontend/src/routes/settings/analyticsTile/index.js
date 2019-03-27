import { h, Component } from 'preact';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import { Get } from '../../../Fetcher';
import ownStyle from './style.css';
import style from '../style.css';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';
import TextField from 'preact-material-components/TextField';
import Switch from 'preact-material-components/Switch';

export default class AnalyticsTile extends Component {

    state = {
    	stats: [],
    	presentedStats: {}
    };

    bindDialog = ref => this.analyticsDialog = ref;

    openDialog = async () => {
    	const statsTask = Get('/api/visits/latest-month').then(res => res.json());
    	this.analyticsDialog.MDComponent.show();
    	const stats = await statsTask;
    	const presentedStats = this.groupPresentedStats('Page');
    	this.setState({ stats, presentedStats });
    };

    changeGrouping = ev => this.setState({ presentedStats: this.groupPresentedStats(ev.target.dataset.grouping) });
    groupPresentedStats = prop => {
    	let presentedStats = groupBy(this.state.stats, prop);
    	presentedStats = orderBy(presentedStats, ['length'], ['desc']);
    	presentedStats = presentedStats.reduce((acc, group) => {acc[group[0][prop]] = group; return acc;}, {});
    	return presentedStats;
    };

    render(props, state) {
    	return (
    		<span>
    			<Card class={[style.card, style.threeBlock].join(' ')}>
    				<Typography headline6>Analytics</Typography>
    				<Icon class="hoverIcon right" onClick={this.openDialog} title="View analytics">open_in_new</Icon>

    				<TextField className="fullwidth" label="Google Analytics Tracking ID" value={props.googleAnalytics} onChange={props.onGoogleAnalyticsChanged} />
    				<div style={{ margin: '8px 0 8px 4px' }}>
    					<Typography style={{ 'margin-right': '10px' }} body1>Server-side analytics</Typography>
    					<Switch checked={props.serverSideTracking} onChange={props.onServerSideTrackingChanged} />
    				</div>
    			</Card>

    			<Dialog ref={this.bindDialog}>
    				<Dialog.Header>Analytics</Dialog.Header>
    				<Dialog.Body>
    					{!props.serverSideTracking && (
    						<div style={{ 'background-color': 'rgba(224,224,224,0.5)', 'padding-left': '2px' }}>
    							<Typography caption>Server-side tracking is currently disabled</Typography>
    						</div>
    					)}
    					<Typography body1>Stats for the latest month</Typography>

    					<div>
    						<Typography body2>Group by</Typography>
    						<button class={ownStyle.groupButton} data-grouping="Page" onClick={this.changeGrouping}>Visited page</button>
    						<button class={ownStyle.groupButton} data-grouping="OS" onClick={this.changeGrouping}>Operating System</button>
    						<button class={ownStyle.groupButton} data-grouping="UserAgent" onClick={this.changeGrouping}>User-agent</button>
    						<button class={ownStyle.groupButton} data-grouping="Device" onClick={this.changeGrouping}>Device used</button>
    					</div>

    					<hr />
    					<table class="fullwidth striped">
    						{Object.keys(state.presentedStats).map(page => {
    							const pageStats = state.presentedStats[page];
    							return (
    								<tr key={page}>
    									<td>
    										<Typography body2>{page}</Typography>
    									</td>
    									<td>
    										<Typography body2>{pageStats.length} visits</Typography>
    									</td>
    								</tr>
    							);
    						})}
    					</table>
    				</Dialog.Body>
    				<Dialog.Footer>
    					<Dialog.FooterButton accept>Done</Dialog.FooterButton>
    				</Dialog.Footer>
    			</Dialog>
    		</span>
    	);
    }
}
