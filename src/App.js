import React, { Component } from 'react';
import { Row, Col, Input, Button, Card, Layout, Table } from 'antd';

import './App.css';
import solvePuzzleVanillaJs from './skyscrapers';

const { Header, Content } = Layout;
const InputGroup = Input.Group;

/*
const transpose = (matrix) => {
  const width = matrix.length;
  const length = matrix[0].length;
  const transposed = [];
  for (let i = 0; i < length; ++i) {
    const row = [];
    for (let j = 0; j < width; ++j) {
      row.push(matrix[j][i]);
    }
    transposed.push(row);
  }
  return transposed;
};
*/
const solvePuzzleWasmInterops = (clues) => {
  const buildSkyScrapers = window._buildSkyScrapers;

  // typeless to typed
  const arr = new Int32Array(clues.length);

  clues.forEach(
    (v, i) => {
      arr[i] = v;
    }
  );

  // allocate memory and get address(pointer)
  const buf = window.Module._malloc(arr.length * arr.BYTES_PER_ELEMENT);

  // write data into memory, possible types are HEAP8/16/32, HEAPF32/64, HEAPU8/16/32
  window.Module.HEAP32.set(arr, buf >> 2);

  const result = buildSkyScrapers(buf, arr.length);

  const resultData = []

  for (let i = 0; i < 16; ++i) {
    resultData.push(window.Module.HEAP32[result / Int32Array.BYTES_PER_ELEMENT + i]);
  }

  // don't forget
  window.Module._free(buf);

  return [
    resultData.slice(0, 4),
    resultData.slice(4, 8),
    resultData.slice(8, 12),
    resultData.slice(12, 16)
  ];
};

// console.warn(solvePuzzleWasmInterops([3, 2, 2, 1, 1, 2, 4, 2, 3, 1, 3, 2, 2, 1, 2, 4]))

const cloneMatrix = (matrix) =>
  matrix.map(row => row.map(h => h));

const getArr = (matrix, num, isRow) => {
  const cm = cloneMatrix(matrix);
  if (isRow) {
    return cm[num];
  } else {
    return cm.map(row => row[num]);
  }
};

const arrEqual = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length === b.length) {
      for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

const isValidArr = (arr) => {
  const ca = arr.map(h => h);
  ca.sort((a, b) => a - b);
  return arrEqual(ca, [1, 2, 3, 4]);
}

const observe = (arr) => {
  if (!isValidArr(arr)) {
    return 'X';
  }
  let count = 0;
  let maxHeight = 0;
  for (let h of arr) {
    if (h > maxHeight) {
      count += 1;
      maxHeight = h;
    }
  }
  return count;
}

const observeAll = (matrix) => {
  let up = [], down = [], left = [], right = [];
  for (let i = 0; i < matrix[0].length; ++i) {
    left.push(observe(getArr(matrix, i, true)));
    right.push(observe(getArr(matrix, i, true).reverse()));
  }
  for (let j = 0; j < matrix.length; ++j) {
    up.push(observe(getArr(matrix, j, false)));
    down.push(observe(getArr(matrix, j, false).reverse()));
  }
  return [].concat(up, right, down.reverse(), left.reverse());
}

const isMatrixValid = (matrix) => {
  return observeAll(matrix).indexOf('X') === -1;
};

class SkyScrapersInput extends Component {
  render() {
    const inputStyle = {
      width: '15%',
      textAlign: 'center'
    };
    const matrix = cloneMatrix(this.props.data);
    const onMatrixChange = this.props.onMatrixChange || function() {};
    return (
      <span>
        {
          matrix.map(
            (row, rowIndex) => (
              <InputGroup key={`row_${rowIndex}`} compact>
                {
                  row.map(
                    (cell, colIndex) => (
                      <Input
                        key={`cell_${colIndex}`}
                        style={inputStyle}
                        value={cell}
                        defaultValue="0"
                        onChange={(e) => onMatrixChange(e.target.value, { row: colIndex, col: rowIndex })}
                        maxLength={1}
                        type="number"
                        onMouseOver={
                          (e) => {
                            e.target.select();
                          }
                        }
                      />
                    )
                  )
                }
              </InputGroup>
            )
          )
        }
      </span>
    );
  };
}

class SkyScrapers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isError: false,
      message: '',
      result: null
    };

    this.benchmark = this.benchmark.bind(this);
  }

  benchmark() {
    this.setState({
      isLoading: true,
      isError: false,
      message: '',
      result: null
    });
    const suite = new window.Benchmark.Suite();

    const that = this;
    let result = null;
    let isError = false;
    let message = '';

    const observed = observeAll(that.props.data);
    that.setState({
      isError: false,
      message: `Observed: [${observed.join(', ')}]`
    });

    if (typeof that.props.solvePuzzle === 'function') {
      suite.add('test', function() {
        try {
          result = that.props.solvePuzzle(observed);
        } catch (err) {
          isError = true;
          message = err.toString();
        }
      });
    } else if (Array.isArray(that.props.solvePuzzle) && that.props.solvePuzzle.every(f => typeof f === 'function')) {
      that.props.solvePuzzle.forEach(
        (f) => {
          suite.add(`test#${f.name}`, function() {
            try {
              result = f(observed);
            } catch (err) {
              isError = true;
              message = err.toString();
            }
          });
        }
      );
      suite.on('complete', function() {
        that.setState({
          message: `${that.state.message} Fastest is ${this.filter('fastest').map('name')}`
        });
      });
    }

    suite.on('cycle', function(event) {
      that.setState({
        isError: false,
        message: `${that.state.message} ${String(event.target)}`
      });
    }).on('complete', function() {
      that.setState({
        isLoading: false,
        result,
        isError,
        message: message ? message : that.state.message
      });
    }).run({ 'async': true });
  }

  formatForTable(data, masked) {
    return data.map(
      (row, i) =>
        row.reduce(
          (o, v, i) => {
            masked ? o[i] = 'X' : o[i] = v;
            return o;
          },
          {
            key: `row_${i}`
          }
        )
    );
  }

  genSkyScrapers(matrix, masked) {
    const oneColumn = [{
      dataIndex: '0',
      align: 'center'
    }];

    const columns = [{
      dataIndex: '0',
      align: 'center'
    }, {
      dataIndex: '1',
      align: 'center'
    }, {
      dataIndex: '2',
      align: 'center'
    }, {
      dataIndex: '3',
      align: 'center'
    }];
  
    return (
      <span>
        <Row>
          <Col span={14} offset={5}>
            <Table
              columns={columns}
              dataSource={[
                {
                  key: 'row_top',
                  '0': observe(getArr(matrix, 0, false)),
                  '1': observe(getArr(matrix, 1, false)),
                  '2': observe(getArr(matrix, 2, false)),
                  '3': observe(getArr(matrix, 3, false))
                }
              ]}
              showHeader={false}
              size="small"
              pagination={false}
              bordered
            />
          </Col>
        </Row>
        <br /> 
        <Row>
          <Col span={4}>
            <Table
              columns={oneColumn}
              dataSource={[
                {
                  key: 'left_0',
                  '0': observe(getArr(matrix, 0, true))
                }, {
                  key: 'left_1',
                  '0': observe(getArr(matrix, 1, true))
                }, {
                  key: 'left_2',
                  '0': observe(getArr(matrix, 2, true))
                }, {
                  key: 'left_3',
                  '0': observe(getArr(matrix, 3, true))
                }
              ]}
              showHeader={false}
              size="small"
              pagination={false}
              bordered
            />
          </Col>
          <Col span={14} offset={1}>
            <Table
              columns={columns}
              dataSource={this.formatForTable(matrix, masked)}
              showHeader={false}
              size="small"
              pagination={false}
              bordered
            />
          </Col>
          <Col span={4} offset={1}>
            <Table
              columns={oneColumn}
              dataSource={[
                {
                  key: 'right_0',
                  '0': observe(getArr(matrix, 0, true).reverse())
                }, {
                  key: 'right_1',
                  '0': observe(getArr(matrix, 1, true).reverse())
                }, {
                  key: 'right_2',
                  '0': observe(getArr(matrix, 2, true).reverse())
                }, {
                  key: 'right_3',
                  '0': observe(getArr(matrix, 3, true).reverse())
                }
              ]}
              showHeader={false}
              size="small"
              pagination={false}
              bordered
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col span={14} offset={5}>
            <Table
              columns={columns}
              dataSource={[
                {
                  key: 'row_bottom',
                  '0': observe(getArr(matrix, 0, false).reverse()),
                  '1': observe(getArr(matrix, 1, false).reverse()),
                  '2': observe(getArr(matrix, 2, false).reverse()),
                  '3': observe(getArr(matrix, 3, false).reverse())
                }
              ]}
              showHeader={false}
              size="small"
              pagination={false}
              bordered
            />
          </Col>
        </Row>
      </span>
    );
  }

  render() {
    const matrix = cloneMatrix(this.props.data);
    const masked = this.props.masked;

    return (
      <span style={{ width: '40%' }}>
        {this.genSkyScrapers(matrix, masked)}
        {
          this.props.masked ? <hr /> : null
        }
        {
          this.props.masked ?
          <Button
            type="primary"
            size="large"
            loading={this.state.isLoading}
            onClick={this.benchmark}
            disabled={!isMatrixValid(this.props.data)}
          >
            Benchmark
          </Button> : null
        }
        {
          this.state.message ?
          <h1 style={{ color: this.state.isError ? 'red' : 'green' }}>{this.state.message}</h1> : null
        }
        {
          this.state.result ?
          this.genSkyScrapers(matrix, false) : null
        }
      </span>
    );
  }
} 

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [
        [1, 2, 3, 4],
        [2, 4, 1, 3],
        [4, 3, 2, 1],
        [3, 1, 4, 2]
      ]
    };

    this.onMatrixChange = this.onMatrixChange.bind(this);
  }

  onMatrixChange(v, { row, col }) {
    const updatedData = cloneMatrix(this.state.data);
    updatedData[col][row] = parseInt(v, 10);
    this.setState({
      data: updatedData
    });
  }

  render() {
    return (
      <div className="App">
        <Header className="App-header">
          A good day to WASM
        </Header>
        <Content style={{ padding: '50px 50px' }}>
          <Row>
            <Col span={10} offset={7}>
              <Card>
                <h1>Sky Scrapers</h1>
                <SkyScrapersInput
                  data={this.state.data}
                  onMatrixChange={this.onMatrixChange}
                />
                <hr />
                <SkyScrapers
                  data={this.state.data}
                />
                <br />
                {
                  isMatrixValid(this.state.data) ?
                    <h1 style={{ color: 'green' }}>Valid</h1> : <h1 style={{ color: 'red' }}>Invalid</h1>
                }
              </Card>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={10} offset={1}>
              <Card>
                <h1>Vanilla JS</h1>
                <SkyScrapers
                  data={this.state.data}
                  solvePuzzle={solvePuzzleVanillaJs}
                  masked
                />
              </Card>
            </Col>
            <Col span={10} offset={2}>
              <Card>
                <h1>WASM Interoperate</h1>
                <SkyScrapers
                  data={this.state.data}
                  solvePuzzle={solvePuzzleWasmInterops}
                  masked
                />
              </Card>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={10} offset={7}>
              <Card>
                <h1>Vanilla JS vs. WASM Interoperate</h1>
                <SkyScrapers
                  data={this.state.data}
                  solvePuzzle={[solvePuzzleVanillaJs, solvePuzzleWasmInterops]}
                  masked
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </div>
    );
  }
}

export default App;
