import React, { Component } from 'react';

class Card extends Component {
    render() {
        return (
            <div>
                <div style={{ backgroundColor: '#99b7c3'}} data-testid="cc-block-1">
                    {
                        this.props.renderFooter()
                    }
                </div>
                <div style={{ backgroundColor: '#9676b3'}} data-testid="cc-block-2">
                    {
                        this.props.renderBody()
                    }
                </div>
                <div style={{ backgroundColor: '#d4ce83'}} data-testid="cc-block-3">
                    {
                        this.props.renderFooter()
                    }
                </div>
            </div>
        )
    }
}

class CardUser extends Component {
    render() {
        return (
            <Card renderHeader={() => <div>Header</div>}
                    renderFooter={() => <div>Footer</div>}
                    renderBody={() => <div>Body</div>}
            />
        )
    }
}


/**
 * 🚨 🚨 DO NOT DELETE OR CHANGE THIS.🚨 🚨
 * This is how you would use your above component 
 * The output of this code is displayed on the browser on the left hand side
 */
const Usage = (props) => {
    return <CardUser />
}

export default Usage;