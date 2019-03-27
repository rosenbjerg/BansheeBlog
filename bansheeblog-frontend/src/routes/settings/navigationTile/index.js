import { h, Component } from 'preact';
import linkState from 'linkstate';
import style from '../style.css';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';
import TextField from 'preact-material-components/TextField';

export default class NavigationTile extends Component {

    state = {
    	newNavigationItemName: '',
    	newNavigationItemUrl: 'https://',
    };

    bindDialog = ref => this.manageNavigationForm = ref;

    openDialog = () => this.manageNavigationForm.MDComponent.show();

    itemAdded = () => {
    	const navItem = {
    		Name: this.state.newNavigationItemName,
    		Href: this.state.newNavigationItemUrl
    	};
    	this.setState(state => {
    		state.newNavigationItemName = '';
    		state.newNavigationItemUrl = 'https://';
    		this.props.itemAdded(navItem);
    	});
    };

    render(props, state) {
    	return (
    		<span>
    			<Card class={[style.card, style.oneBlock].join(' ')}>
    				<Typography headline6>Navigation</Typography>
    				<Icon class="hoverIcon right" onClick={this.openDialog} title="Manage navigation items">open_in_new</Icon>
    			</Card>

    			<Dialog ref={this.bindDialog}>
    				<Dialog.Header>Navigation</Dialog.Header>
    				<Dialog.Body>
    					<Typography body1>Current menu navigation items</Typography>
    					<table class="fullwidth striped">
    						{(props.items || []).map(nav => (
    							<tr key={nav.Name}>
    								<td>
    									<Typography body2>{nav.Name}</Typography>
    								</td>
    								<td>
    									<a href={nav.Href}>{nav.Href}</a>
    								</td>
    								<td>
    									<Icon class="hoverIcon" onClick={props.itemRemoved(nav)}>close</Icon>
    								</td>
    							</tr>
    						))}
    					</table>
    					<br />
    					<hr />
    					<br />
    					<table class="fullwidth">
    						<tr>
    							<td colSpan={3}>
    								<Typography body1>Add menu item</Typography>
    							</td>
    						</tr>
    						<tr>
    							<td>
    								<TextField class="fullwidth" value={state.newNavigationItemName} onChange={linkState(this, 'newNavigationItemName')} label="Name" />
    							</td>
    							<td>
    								<TextField class="fullwidth" value={state.newNavigationItemUrl} onChange={linkState(this, 'newNavigationItemUrl')} label="Link" />
    							</td>
    							<td>
    								<Icon class="hoverIcon" onClick={this.itemAdded}>add</Icon>
    							</td>
    						</tr>
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
