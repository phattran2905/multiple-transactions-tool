import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import Alert from "react-bootstrap/Alert"
import Nav from "react-bootstrap/Nav"
import { GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import Icon from "../Icon/Icon"
import IconNames from "../Icon/IconNames"
import {
    getDataTable,
    removeTable,
    setResultMessages,
    setTableType,
    TABLE_TYPES
} from "../../redux/DataTable"
import EthereumThunk from "../../redux/thunk/EthereumThunk"
import BscThunk from "../../redux/thunk/BscThunk"
import TronThunk from "../../redux/thunk/TronThunk"
import { setStage, STAGES, setFeature, setToken } from "../../redux/Stage"
import { FEATURES } from "../../constants"
import TokenDropdown from "../Dropdown/TokenDropdown"

function CustomToolbar() {
    const network = useSelector((state) => state.network)
    const { tableType, feature } = useSelector((state) => state.dataTable)
    const { token } = useSelector((state) => state.stage)
    const dispatch = useDispatch()
    const [error, setError] = useState("")

    useEffect(() => {
        dispatch(setToken(null))
    }, [network])

    const getBalance = () => {
        switch (network.id) {
            case "ethereum":
            case "ropsten": {
                dispatch(
                    EthereumThunk.getBalance({
                        token
                    })
                )
                break
            }
            case "bsc":
            case "bsc-testnet": {
                dispatch(
                    BscThunk.getBalance({
                        token
                    })
                )
                break
            }
            case "tron":
            case "shasta": {
                dispatch(
                    TronThunk.getBalance({
                        token
                    })
                )
                break
            }

            default:
                break
        }
    }

    // Remove the dropped file
    const dropTable = () => {
        dispatch(removeTable({ table: tableType }))
    }

    // Display error
    const displayTokenError = (_status) => {
        if (_status) setError("Please select a token.")
        else setError("")
    }

    useEffect(() => {
        if (token) displayTokenError(false)
    }, [token])

    // Get balance
    const getBalanceHandler = () => {
        displayTokenError(false)

        if (!token) {
            displayTokenError(true)
            return
        }

        dispatch(setFeature({ feature: FEATURES.GetBalance, token }))
        dispatch(setStage(STAGES.Logger))
        dispatch(setResultMessages([]))
        dispatch(getDataTable({ table: TABLE_TYPES.Input }))
        getBalance()
    }

    const collectHandler = () => {
        if (!token) {
            displayTokenError(true)
            return
        }

        dispatch(setFeature({ feature: FEATURES.Collect, token }))
        dispatch(setStage(STAGES.CollectForm))
    }

    const spreadHandler = () => {
        if (!token) {
            displayTokenError(true)
            return
        }

        dispatch(setFeature({ feature: FEATURES.Spread, token }))
        dispatch(setStage(STAGES.SpreadForm))
    }

    return (
        <GridToolbarContainer className="mb-4 justify-content-between">
            {/* Get balance / Collect / Spread */}
            <Row>
                <Col>
                    <TokenDropdown
                        buttonVariant="outline-dark"
                        title="Get Balance"
                        handleClick={getBalanceHandler}
                    />
                    <TokenDropdown
                        buttonVariant="outline-success"
                        title="Collect"
                        handleClick={collectHandler}
                    />
                    <TokenDropdown
                        buttonVariant="outline-primary"
                        title="Spread"
                        handleClick={spreadHandler}
                    />

                    {error && (
                        <Alert className="mx-2 d-inline p-2" variant="danger">
                            Please select a token
                        </Alert>
                    )}
                </Col>
            </Row>

            {/* Input / Result table */}
            <Row>
                <Col>
                    <Nav variant="tabs" defaultActiveKey="input-table">
                        <Nav.Item>
                            <Nav.Link
                                className={
                                    tableType === TABLE_TYPES.Input
                                        ? "btn bg-warning text-white"
                                        : "btn border"
                                }
                                eventKey="input-table"
                                onClick={() => dispatch(setTableType(TABLE_TYPES.Input))}>
                                Input
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                className={
                                    tableType === TABLE_TYPES.Result
                                        ? "btn bg-warning text-white"
                                        : "btn border"
                                }
                                eventKey="result-table"
                                onClick={() => dispatch(setTableType(TABLE_TYPES.Result))}>
                                Result {feature && `(${feature})`}
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>
            </Row>

            {/* Export / Remove file */}
            <Row>
                <Col>
                    <div className="p-0 btn btn-outline-secondary">
                        <GridToolbarExport
                            variant="outline-secondary"
                            printOptions={{ disableToolbarButton: true }}
                        />
                    </div>
                </Col>
                <Col>
                    <Button variant="outline-danger" onClick={dropTable}>
                        <Icon name={IconNames.FaTimes} />
                    </Button>
                </Col>
            </Row>
        </GridToolbarContainer>
    )
}

export default CustomToolbar
