import React from 'react';

class visRxWidget extends React.Component {
    constructor(props) {
        super(props);
        this.onStateChanged = this.onStateChanged.bind(this);
        this.state = { ...props, values: {} };
        this.linkContext = {
            IDs: [],
        };
    }

    // eslint-disable-next-line class-methods-use-this
    renderWidgetBody() {

    }

    getIdSubscribeState = (id, cb) => {
        return this.props.socket.getState(id)
            .then(result => {
                cb(id, result);
                return this.props.socket.subscribeState(id, (resultId, result) => cb(id, result));
            });
    };

    onStateChanged(id, state) {
        if (!state) {
            return;
        }
        const values = JSON.parse(JSON.stringify(this.state.values));
        Object.keys(state).forEach(key =>
            values[`${id}.${key}`] = state[key]);
        this.setState({ values });
    }

    async componentDidMount() {
        this.getWidgetInfo()?.visAttrs?.forEach(group =>
            group?.fields?.forEach(field => {
                if (field?.type === 'id') {
                    Object.keys(this.state.data).forEach(dataKey => {
                        // do not use here \d instead of [0-9] as it will be wrong compiled
                        if (dataKey.match(new RegExp(`^${field.name}[0-9]*$`))) {
                            const oid = this.state.data[dataKey];
                            if (!this.linkContext.IDs.includes(oid)) {
                                this.linkContext.IDs.push(oid);
                            }
                        }
                    });
                }
            }));

        for (let i = 0; i < this.linkContext.IDs.length; i++) {
            await this.getIdSubscribeState(this.linkContext.IDs[i], this.onStateChanged);
        }
    }

    componentWillUnmount() {
        this.linkContext.IDs.forEach(oid =>
            this.props.socket.unsubscribeState(oid, this.onStateChanged));
    }

    render() {
        return <div style={{ width: this.state.style?.width, height: this.state.style?.height }}>
            {this.renderWidgetBody()}
        </div>;
    }
}

export default visRxWidget;
