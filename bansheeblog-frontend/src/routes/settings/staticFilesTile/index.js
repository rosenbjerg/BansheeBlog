/* eslint-disable no-mixed-spaces-and-tabs */
import { h, Component } from 'preact';
import copy from 'clipboard-copy';
import linkState from 'linkstate';
import { Delete, Get, Post } from '../../../Fetcher';
import Globals from '../../../Globals';
import Upload from '../../../components/upload';
import style from '../style.css';
import ownStyle from './style.css';
import remove from 'lodash/remove';

import Card from 'preact-material-components/Card';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';
import Button from 'preact-material-components/Button';
import Switch from 'preact-material-components/Switch';

export default class StaticFilesTile extends Component {

    state = {
        files: [],
        unzipFile: false,
        canUnzipFile: false,
        selectedFiles: [],
    };

    prepareFiles = files => {
        files.sort();
        const port = location.port === 80 ? '' : ':' + location.port;
        const baseUrl = `${location.protocol}//${location.hostname}${port}/static/`;
        return files.map(file => ({
            name: file,
            copyLink: () => copy(baseUrl + file),
            remove: this.openDeleteDialog(file)
        }));
    };

    openManageDialog = () => {
        Get('/api/files')
            .then(res => res.json())
            .then(this.prepareFiles)
            .then(files => this.setState({ files }));

        this.manageDialog.MDComponent.show();
    };
    openDeleteDialog = (name) => () => {
        this.setState({
            toDelete: name
        });
        this.deleteDialog.MDComponent.show();
    };
    onFileSelected = files => {
        this.setState({
            canUnzipFile: files.findIndex(file => file.name.toLowerCase().endsWith('.zip')) > -1,
            selectedFiles: files
        });
    };
    deleteFile = async () => {
        const name = this.state.toDelete;
        const response = await Delete(`/api/file`, name, false);
        if (response.ok) {
            Globals.showSnackbar(`The file has been deleted`);
            this.setState(state => {
                remove(state.files, file => file.name === name);
            });
        }
    };

    submitFileUpload = async ev => {
        ev.preventDefault();
        const formData = new FormData(ev.target);
        formData.append('unzip', this.state.canUnzipFile && this.state.unzipFile);
        const response = await Post('/api/file', formData, false);

        if (response.ok){
            const files = this.prepareFiles(await response.json());
            this.setState({
                files,
                selectedFiles: [],
                unzipFile: false,
                canUnzipFile: false });
            ev.target.reset();
        }
        else {
            Globals.showSnackbar('Could not upload file');
        }

    };

    bindDeleteDialog = ref => this.deleteDialog = ref;
    bindManageDialog = ref => this.manageDialog = ref;

    render(props, state) {
        return (
            <span>
                <Card class={[style.card, style.oneBlock].join(' ')}>
    				<Typography headline6>Public files</Typography>
    				<Icon class="hoverIcon right" onClick={this.openManageDialog} title="Manage public files">open_in_new</Icon>
    			</Card>

                <Dialog ref={this.bindManageDialog}>
                    <Dialog.Header>Manage static files</Dialog.Header>
                    <Dialog.Body>
                        <Typography>All files</Typography>
                        <table className={ownStyle.fileList + ' fullwidth striped'}>
                            {state.files.map(file => (
                                <tr key={file.name} className={ownStyle.files}>
                                    <td>
                                        <Typography body1>{file.name}</Typography>
                                    </td>
                                    <td>
                                        <Icon class="hoverIcon" onClick={file.copyLink} title="Copy link">insert_link</Icon>
                                        <Icon class="hoverIcon" onClick={file.remove} title="Delete file">delete_permanently</Icon>
                                    </td>
                                </tr>
                            ))}
                        </table>
                        <br />
                        <hr />
                        <br />
                        <Typography>Upload more files</Typography>
                        <form onSubmit={this.submitFileUpload}>
                            <div>
                                <Upload name="files" selected={state.selectedFiles} onChange={this.onFileSelected} required multiple />
                            </div>
                            <Button type="submit">Upload</Button>
                            {state.canUnzipFile && (
                                <div style={{ margin: '8px 0 8px 4px' }}>
                                    <Typography style={{ 'margin-right': '10px' }} body1>Unzip file(s)?</Typography>
                                    <Switch checked={state.unzipFile} onChange={linkState(this, 'unzipFile')} />
                                </div>
                            )}
                        </form>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.FooterButton accept>Done</Dialog.FooterButton>
                    </Dialog.Footer>
                </Dialog>

    			<Dialog ref={this.bindDeleteDialog} onAccept={this.deleteFile}>
    				<Dialog.Header>Delete file?</Dialog.Header>
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
