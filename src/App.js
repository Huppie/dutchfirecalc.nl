import React, { Component } from 'react';
import Plot from './Plot.js';
import Taxes from './Taxes.js';
import Simulation from './Simulation.js';
import Format from './Format.js';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            initialCapital: 800000,
            initialSpending: 32000,
            duration: 30, // years
            pctFees: 0.15, // pct as provided by the user
            taxStrategy: Object.keys(Taxes)[0], // must exist on Taxes object
            id: '',
            results: [],
            simulations: 0,
            best: null,
            worst: null,
            successRate: null,
            busy: false,            
        }

        this.runSimulation = this.runSimulation.bind(this)
        this.stopSimulation = this.stopSimulation.bind(this)
    }

    runSimulation(evt) {
        evt.preventDefault();

        let sim = new Simulation(this.state)
        this.setState({
            successRate: 1,
            results: [], 
            simulations: sim.i,
            busy: true,
            id: Math.random(0, 1).toString(),
            currentPeriodStart: sim.currentPeriodStart(),
            currentPeriodEnd: sim.currentPeriodEnd(),
        })

        let batchSize = 12;
        let tick = () => {

            // perform another batch of runs
            for(var i=0; i<batchSize; i++) {
                sim.run();
            }
            
            // update state
            this.setState({
                best: sim.best,
                worst: sim.worst,
                successRate: sim.successful / sim.i,
                results: sim.results,
                simulations: sim.i,
                currentPeriodStart: sim.currentPeriodStart(),
                currentPeriodEnd: sim.currentPeriodEnd(),
            })

            // keep going unless done or user canceled
            if (this.state.busy && !sim.done()) {
                window.requestAnimationFrame(tick);   
            } else {
                this.stopSimulation()
            }
        }

        window.requestAnimationFrame(tick);   
    }

    stopSimulation(evt) {
        this.setState({
            id: '',
            busy: false,
        })
    }

    render() {
        return (
            <div className="container app">
                <h1>Dutch FIRE Calculator</h1>
                <p>This tool simulates a portfolio its performance using a yearly spending amount (adjusted for inflation), investment fees and real tax calculation.</p>
                <p>The simulation uses historical returns for the S&amp;P 500 with dividends re-invested, going back to 1871.</p>

                <form className="" onSubmit={this.runSimulation}>
                    <div className="margin-m">
                        <label>Initial capital</label>
                        <input type="number" value={this.state.initialCapital} disabled={this.state.busy} onChange={e => this.setState({initialCapital: parseInt(e.target.value)})} step="1000" min="0" />
                    </div>
                    <div className="margin-m">
                        <label>Initial yearly spending</label>
                        <input type="number" value={this.state.initialSpending} disabled={this.state.busy} onChange={e => this.setState({initialSpending: parseInt(e.target.value)})} step="100" min="0" /> 
                        <div>
                            <small >(equals a withdrawal rate of {(this.state.initialSpending / this.state.initialCapital* 100).toFixed(1)}%</small>
                        </div>
                    </div>
                    <div className="margin-m">
                        <label>Duration <small>(years)</small></label>
                        <input type="number" value={this.state.duration} disabled={this.state.busy} onChange={e => this.setState({duration: parseInt(e.target.value)})}  min="5" max="80" step="1" />
                        
                    </div>
                    <div className="margin-m">
                        <label>Fees <small>(% per year)</small></label>
                        <input type="number" value={this.state.pctFees} disabled={this.state.busy} onChange={e => this.setState({pctFees: parseFloat(e.target.value)})} step="0.01" min="0.00" />
                    </div>
                    <div className="margin-m">
                        <label>Tax strategy</label>
                        <select onChange={e => this.setState({taxStrategy: e.target.value })} value={this.state.taxStrategy} disabled={this.state.busy}>
                            {Object.keys(Taxes).map(k => (<option key={k} value={k}>{k}</option>))}
                        </select>
                    </div>
                    <div className="margin-m">
                        {this.state.busy ? ( 
                            <span>
                                <button type="button" className="" onClick={this.stopSimulation}>Stop simulation</button>
                                <span className="l-margin-s small">&mdash; simulating {this.state.currentPeriodStart} - {this.state.currentPeriodEnd}</span>
                            </span>
                        ) : (<button type="submit">Run simulation</button>)}
                    </div>
                </form>
               <div className="right">
                {this.state.results.length > 0 ? 
                    (<div>
                        <div className="margin-m">
                            <p>This strategy had a success rate of <strong>{Format.percentage(this.state.successRate)}</strong> out of {this.state.simulations} tested {this.state.duration} year periods.</p>
                        </div>
                        <div className="margin-m">
                            <Plot xMax={this.state.duration * 12} wot={Math.random()} datasets={this.state.results} id={this.state.id} />
                        </div>
                        <div className="small">
                            <ul>
                                <li>The initial spending amount of {Format.money(this.state.initialSpending)} is adjusted for inflation each year.</li>
                                <li>For our purposes, failure means the portfolio was depleted before the end of the {this.state.duration} year period.</li>
                                <li>The highest portfolio balance at the end of your retirement was <span>{Format.money(this.state.best)}</span> (not inflation adjusted).</li>
                            </ul>
                        </div>
                    </div>) : ''}
                </div>

            </div>
        );
    }
}

export default App;
