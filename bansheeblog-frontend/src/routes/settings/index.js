import { h, Component } from 'preact';
import Markup from 'preact-markup';
import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import style from './style.css';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Button from 'preact-material-components/Button';
import Icon from 'preact-material-components/Icon';
import TabBar from 'preact-material-components/TabBar';
import 'preact-material-components/TabBar/style.css';
import 'preact-material-components/Dialog/style.css';
import 'preact-material-components/Typography/style.css';
import { Delete, Get } from '../../Fetcher';
import { route } from 'preact-router';
import Globals from '../../Globals';

export default class Settings extends Component {

	state = {

	};

	articleToDelete = undefined;

	openDeletePrompt = article => () => {
		this.articleToDelete = article;
		this.dialog.MDComponent.show();
	};

	load = async () => {
		const response = await Get('/api/settings');
		if (response.ok) {
			const settings = await response.json();
			this.setState({ settings });
		}
		else {
			route('/login');
		}
	};

	bindDialog = ref => this.dialog = ref;

	componentDidMount() {
		this.load();
	}

	render(props, state) {
		return (
			<div class={style.home}>
                <TabBar>
                    <TabBar.Tab active>
                        <TabBar.TabLabel>Tab1</TabBar.TabLabel>
                    </TabBar.Tab>
                    <TabBar.Tab>
                        <TabBar.TabLabel>Tab2</TabBar.TabLabel>
                    </TabBar.Tab>
                    <TabBar.Tab>
                        <TabBar.TabLabel>Tab3</TabBar.TabLabel>
                    </TabBar.Tab>
                </TabBar>
				<Typography headline4>Settings</Typography>



				<Dialog ref={this.bindDialog}>
					<Dialog.Header>Delete article?</Dialog.Header>
					<Dialog.Body>
						Are you sure you want to delete the article?
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.FooterButton cancel>Decline</Dialog.FooterButton>
						<Dialog.FooterButton accept>Accept</Dialog.FooterButton>
					</Dialog.Footer>
				</Dialog>
			</div>
		);
	}
}
