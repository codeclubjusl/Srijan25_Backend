const { Html, Button } = require("@react-email/components");

function Email(props) {
  const { url } = props;

  return (
    <Html lang="en">
      <Button href={url}>Click me</Button>
    </Html>
  );
}
module.exports = Email
