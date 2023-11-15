import { getConfig } from '../../config';

function BuyButton(props) {
    return (
        <stripe-buy-button
            buy-button-id={props.id}
            publishable-key={getConfig().stripe.publishableKey}
            client-reference-id={props.referenceId}
        ></stripe-buy-button>
    );
}

export default BuyButton;
