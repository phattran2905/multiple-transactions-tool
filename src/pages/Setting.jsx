import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import InputGroup from "react-bootstrap/InputGroup"
import FormControl from "react-bootstrap/FormControl"
import Accordion from "react-bootstrap/Accordion"
import Alert from "react-bootstrap/Alert"
import Table from "react-bootstrap/Table"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { addToken, removeTokenByAddress, updateNetworks } from "../redux/Setting"
import Network from "../objects/Network"
import Icon from "../components/Icon/Icon"
import IconNames from "../components/Icon/IconNames"
import NetworkDropdown from "../components/Dropdown/NetworkDropdown"
import { updateChosenNetwork } from "../redux/Network"
import Spinner from "../components/Spinner/Spinner"
import { addAbi, removeAbiByAddress } from "../redux/ABI"
import RpcInput from "../components/Form/TextInput/RpcInput"
import RpcSelect from "../components/Form/Select/RpcSelect"

function Setting() {
    const setting = useSelector((state) => state.setting)
    const chosenNetwork = useSelector((state) => state.network)
    const dispatch = useDispatch()
    const [mainNetworks, setMainNetworks] = useState([])
    const [testNetworks, setTestNetworks] = useState([])
    const [network, setNetwork] = useState(new Network({ ...chosenNetwork }))
    const [tokens, setTokens] = useState(chosenNetwork.tokens)
    const [tokenAddress, setTokenAddress] = useState("")
    const [tokenError, setTokenError] = useState("")
    const [tokenSuccess, setTokenSuccess] = useState("")
    const [endpointSuccess, setEndpointSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const mainNets = []
        const testNets = []

        setting.networks.forEach((_network) => {
            const newNetwork = new Network({ ..._network })
            if (_network.type === "mainnet") {
                mainNets.push(newNetwork)
            } else {
                testNets.push(newNetwork)
            }
        })

        setMainNetworks(mainNets)
        setTestNetworks(testNets)
    }, [setting.networks])

    useEffect(() => {
        setTokens(chosenNetwork.tokens)
    }, [chosenNetwork])

    useEffect(() => {
        setTokens(network.tokens)
    }, [network])

    const onChangeEndpoint = (networkId, networkType, rpcEndpoint) => {
        if (networkType === "mainnet") {
            setMainNetworks((prevItems) =>
                prevItems.map((item) => {
                    if (item.id === networkId) {
                        item.rpcEndpoint = rpcEndpoint
                    }
                    return item
                })
            )
        } else {
            setTestNetworks((prevItems) =>
                prevItems.map((item) => {
                    if (item.id === networkId) {
                        item.rpcEndpoint = rpcEndpoint
                    }
                    return item
                })
            )
        }
    }

    const onSaveEndpoints = async (e) => {
        e.preventDefault()

        // Networks with updated "hasValidProvider" property
        const validatedNetworks = [...mainNetworks, ...testNetworks].map((_network) =>
            _network.checkProvider()
        )
        // Convert the array from "Networks" to "Objects"
        const newNetworks = validatedNetworks.map((_network) => ({ ..._network }))
        // Save networks to local storage
        dispatch(updateNetworks({ networks: newNetworks }))
        // Update provider of the chosen network
        if (chosenNetwork.id) {
            const updateNetwork = newNetworks.find((_network) => _network.id === chosenNetwork.id)
            dispatch(updateChosenNetwork({ chosenNetwork: updateNetwork }))
        }

        if (newNetworks.findIndex((_network) => _network.hasValidProvider) !== -1) {
            setEndpointSuccess("Successful!")
            setTimeout(() => {
                setEndpointSuccess("")
            }, 1800)
        }
    }

    const addTokenHandler = async () => {
        setIsLoading(true)
        setTokenSuccess("")
        setTokenError("")

        // Not select network
        if (!network.id) {
            setIsLoading(false)
            setTokenSuccess("")
            setTokenError("Please select a network")
            return
        }

        // Not provide the provider
        if (!network.hasValidProvider) {
            setIsLoading(false)
            setTokenSuccess("")
            setTokenError("Please set up provider for the network first.")
            return
        }

        // Already existed token
        const existed = network.tokens.findIndex((_token) => _token.address === tokenAddress)
        if (existed !== -1) {
            setIsLoading(false)
            setTokenSuccess("")
            setTokenError("Token already existed.")
            return
        }

        // const web3js = new Web3js(network.rpcEndpoint)
        // const { data: newToken } = await web3js.getTokenData(tokenAddress, network.id)
        const { data: newToken, error } = await network.getTokenDataByAddress(tokenAddress)
        // Failed to get token's data
        if (error) {
            setIsLoading(false)
            setTokenSuccess("")
            setTokenError(error)
            return
        }

        // Save token's data
        dispatch(
            addToken({
                networkId: network.id,
                token: newToken
            })
        )
        dispatch(addAbi({ tokenAddress: newToken.address, abi: newToken.ABI }))

        // Update to the chosen network
        if (
            network.id === chosenNetwork.id &&
            chosenNetwork.tokens.findIndex((_token) => _token.address === tokenAddress) === -1
        ) {
            const updateNetwork = {
                ...chosenNetwork,
                tokens: [...chosenNetwork.tokens, newToken]
            }
            dispatch(updateChosenNetwork({ chosenNetwork: updateNetwork }))
        }

        setTimeout(() => {
            setIsLoading(false)
            setNetwork((prev) => new Network({ ...prev, tokens: [...prev.tokens, newToken] }))
            setTokenSuccess("Successful!")
            setTokenError("")
        }, 1000)
    }

    const removeToken = (_tokenAddress, _networkId) => {
        setTokenSuccess("")
        setTokenError("")
        setIsLoading(true)

        setTimeout(() => {
            setIsLoading(false)

            dispatch(removeTokenByAddress({ tokenAddress: _tokenAddress, networkId: _networkId }))
            dispatch(removeAbiByAddress({ tokenAddress: _tokenAddress }))

            if (_networkId === chosenNetwork.id) {
                const updateNetwork = {
                    ...chosenNetwork,
                    tokens: network.tokens.filter((_token) => _token.address !== _tokenAddress)
                }
                dispatch(updateChosenNetwork({ chosenNetwork: updateNetwork }))
            }

            // Update token list
            setNetwork((_network) => {
                const newTokenList = _network.tokens.filter(
                    (_token) => _token.address !== _tokenAddress
                )

                return new Network({
                    ..._network,
                    tokens: [...newTokenList]
                })
            })
            setTokenSuccess("Successful!")
            setTokenError("")
        }, 1000)
    }

    return (
        <Row>
            <Col className="m-4">
                {/* Provider */}
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>
                            <b>Set Provider</b>
                        </Accordion.Header>
                        <Accordion.Body>
                            <Form onSubmit={onSaveEndpoints}>
                                {/* Mainnet */}
                                <Col className="m-2 p-1">
                                    <h6 className="text-danger">Mainnet</h6>
                                    {mainNetworks.map((_network) => (
                                        <InputGroup key={_network.id} className="mb-3">
                                            <InputGroup.Text id="basic-addon1">
                                                <span className="mx-1">
                                                    {_network.getIconComponent()}
                                                </span>
                                                {_network.name}
                                            </InputGroup.Text>

                                            {_network.id === "bsc" ? (
                                                <RpcSelect
                                                    network={_network}
                                                    saveRpcEndpoint={onChangeEndpoint}
                                                />
                                            ) : (
                                                <RpcInput
                                                    network={_network}
                                                    saveRpcEndpoint={onChangeEndpoint}
                                                />
                                            )}

                                            <Button
                                                className="row"
                                                variant={
                                                    _network.hasValidProvider ? "success" : "danger"
                                                }>
                                                {_network.hasValidProvider && (
                                                    <Icon name={IconNames.AiOutlineCheckCircle} />
                                                )}
                                                {!_network.hasValidProvider && (
                                                    <Icon name={IconNames.AiFillCloseCircle} />
                                                )}
                                            </Button>
                                        </InputGroup>
                                    ))}
                                </Col>

                                {/* Testnet */}
                                <Col className="m-2 p-1">
                                    <h6 className="text-danger">Testnet</h6>
                                    {testNetworks.map((_network) => (
                                        <InputGroup key={_network.id} className="mb-3">
                                            <InputGroup.Text id="basic-addon1">
                                                <span className="mx-1">
                                                    {_network.getIconComponent()}
                                                </span>
                                                {_network.name}
                                            </InputGroup.Text>

                                            {_network.id === "bsc-testnet" ? (
                                                <RpcSelect
                                                    network={_network}
                                                    saveRpcEndpoint={onChangeEndpoint}
                                                />
                                            ) : (
                                                <RpcInput
                                                    network={_network}
                                                    saveRpcEndpoint={onChangeEndpoint}
                                                />
                                            )}

                                            <Button
                                                className="row"
                                                variant={
                                                    _network.hasValidProvider ? "success" : "danger"
                                                }>
                                                {_network.hasValidProvider && (
                                                    <Icon name={IconNames.AiOutlineCheckCircle} />
                                                )}
                                                {!_network.hasValidProvider && (
                                                    <Icon name={IconNames.AiFillCloseCircle} />
                                                )}
                                            </Button>
                                        </InputGroup>
                                    ))}
                                </Col>

                                <Col className="row">
                                    {endpointSuccess && (
                                        <Alert varian="success">{endpointSuccess}</Alert>
                                    )}
                                    <Button
                                        size="md"
                                        type="submit"
                                        className="mb-2"
                                        style={{ width: "100%" }}>
                                        Save
                                    </Button>
                                </Col>
                            </Form>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Col>

            <Col className="m-4">
                {/* Add token */}
                <Accordion defaultActiveKey="2">
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>
                            <b>Tokens</b>
                        </Accordion.Header>
                        <Accordion.Body className="row">
                            <Col md={3} className="pr-0">
                                <NetworkDropdown
                                    selectHandler={(_network) =>
                                        setNetwork(new Network({ ..._network }))
                                    }
                                />
                            </Col>
                            <Col md={9} className="pl-0">
                                <InputGroup className="mb-3">
                                    <FormControl
                                        value={tokenAddress}
                                        onChange={(e) => setTokenAddress(e.target.value)}
                                        placeholder="Token's address"
                                        aria-label="Token's address"
                                    />
                                    <Button
                                        variant="outline-primary"
                                        id="add-token-button"
                                        onClick={addTokenHandler}>
                                        Add
                                    </Button>
                                </InputGroup>
                            </Col>

                            <Col md={12}>
                                {isLoading && (
                                    <div className="text-center">
                                        <Spinner />
                                    </div>
                                )}

                                {tokenError && <Alert variant="danger">{tokenError}</Alert>}
                                {tokenSuccess && <Alert variant="success">{tokenSuccess}</Alert>}
                            </Col>

                            <Col md={12} className="mt-3">
                                <Table bordered hover size="md">
                                    <thead className="bg-dark text-white">
                                        <tr className="text-center">
                                            <td colSpan={5} className="p-2">
                                                <h5 className="m-0">Token List (Ethereum)</h5>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>#</th>
                                            <th>Symbol</th>
                                            <th>Address</th>
                                            <th>Decimal</th>
                                            <th> </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tokens.map((_token, index) => (
                                            <tr key={`${_token.symbol}-${_token.address}`}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <b>{_token.symbol}</b>
                                                </td>
                                                <td>{_token.address}</td>
                                                <td>{_token.decimal}</td>
                                                <td>
                                                    {index !== 0 && (
                                                        <Button
                                                            variant="danger"
                                                            onClick={() =>
                                                                removeToken(
                                                                    _token.address,
                                                                    network.id
                                                                )
                                                            }>
                                                            <Icon name={IconNames.FaTimes} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Col>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Col>
        </Row>
    )
}
export default Setting
