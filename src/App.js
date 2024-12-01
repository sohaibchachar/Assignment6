import React, { Component } from "react";
import FileUpload from "./FileUpload";
import StreamGraph from "./StreamGraph";

class App extends Component {
  state = {
    data: null,
  };

  set_data = (data) => {
    this.setState({ data });
  };

  render() {
    return (
      <div>
        <FileUpload set_data={this.set_data} /> {}
        <StreamGraph data={this.state.data} />
      </div>
    );
  }
}

export default App;
