/* eslint-disable no-mixed-spaces-and-tabs */
import { h, Component } from 'preact';
import { Get, Post } from '../../../Fetcher';
import Globals from '../../../Globals';
import style from '../style.css';
import snarkdown from 'snarkdown';
import Markup from 'preact-markup';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';

export default class UpdateTile extends Component {

    state = {
		updates: null
    };

    bindUpdateDialog = ref => this.updateDialog = ref;

	openUpdateDialog = async () => {
    	if (this.state.updates && this.state.updates.Available) {
			this.updateDialog.MDComponent.show();
    		return;
		}

		Globals.showSnackbar('Searching..');
    	const updates = await Get('/api/update').then(response => response.json());
    	updates.Message = snarkdown(updates.Message);
		this.setState({ updates: updates });
    	if (updates.Available)
			this.updateDialog.MDComponent.show();
    	else
			Globals.showSnackbar('Already running the latest version 👍');
	};

	initiateUpdate = async () => {
		const msg = await Post('/api/update').then(response => response.text());
		Globals.showSnackbar(msg);
	};


    render(props, state) {
    	return (
    		<span>
    			<Card class={[style.card, style.oneBlock].join(' ')}>
    				<Typography headline6>Updates</Typography>
    				<Icon class="hoverIcon right" onClick={this.openUpdateDialog} title="Check for updates">autorenew</Icon>
    			</Card>

				<Dialog ref={this.bindUpdateDialog} onAccept={this.initiateUpdate}>
					<Dialog.Header>New version available!</Dialog.Header>
					<Dialog.Body>
						{state.updates && state.updates.Available ? (
							<span>
								<div>
									<Typography body1>Name: <b>{state.updates.Name}</b></Typography>
								</div>
								<div>
									<Typography body1>Version: <b>{state.updates.Version}</b></Typography>
								</div>
								<div>
									<Typography body2>Released <i>{new Date(state.updates.Released).toLocaleString()}</i></Typography>
								</div>
								<div>
									<Typography body2>
										<a href={state.updates.Url} target="_blank">
											<i>Release notes</i>
										</a>
									</Typography>
								</div>
								<Typography body2>
									Info:
									<Markup markup={state.updates.Message}/>
								</Typography>
								<br/>
								<Typography body2>
									<i>
										Installing the update will initiate the server downloading and extracting the new version.
										The server will then shut down while the new files are installed, and restart when done.
										The downtime should be less than half a minute.
									</i>
								</Typography>
							</span>
							) : (
							<Typography body2>Nothing found yet</Typography>
						)}
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.FooterButton primary accept>Install</Dialog.FooterButton>
						<Dialog.FooterButton cancel>Close</Dialog.FooterButton>
					</Dialog.Footer>
				</Dialog>
    		</span>
    	);
    }
}
