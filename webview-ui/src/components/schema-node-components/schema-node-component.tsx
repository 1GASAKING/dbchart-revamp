import { SchemaNodeComponentHeader, SchemaNodeComponentMainDiv } from "../../styles/schemaNodeComponentStyles/schema-node-component-styles"

const SchemaNodeComponent = () => {
    return (

        <SchemaNodeComponentMainDiv>
            <SchemaNodeComponentHeader>
                <div>
                    <div className="schema-node-header">
                        <div className="schema-label-header-indicator" />

                        <div className="schema-node-header-holder">

                            <div className="schema-label-header">
                                <h4 className="schema-label-text"> Name </h4>
                            </div>

                            <div>
                                <div className="schema-label">

                                </div>
                            </div>

                        </div>

                    </div>


                </div>


            </SchemaNodeComponentHeader>


        </SchemaNodeComponentMainDiv>
    )

}
export default SchemaNodeComponent