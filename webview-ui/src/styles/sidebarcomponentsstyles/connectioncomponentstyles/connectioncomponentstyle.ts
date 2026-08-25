import styled from "styled-components";

interface ConnectionComponentConnectionProp {
  $connected: boolean;
}

 const ConnectionComponentMainDiv = styled.div`
  width: 100%;
  border: 1px solid red;
  padding:0 10px;
  > div {
    width: 100%;
  }
`;

 const ConnectionComponentHeaderDiv = styled.div<ConnectionComponentConnectionProp>`
  width: 100%;
  border:1px solid green;
  > div {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: space-between;
    width: 100%;
  }
  .connected-icon {
    width: 5px;
    height: 5px;
    border-radius: 100%;

    background: ${(p) => (p.$connected ? " #89d185" : "#ef5757")};
  }

  .flex-items {
    align-items: center;
    gap: 1px;
  }
    .connection-button {
    display: flex;
    width: 20px;
    height: 20px;
  }
    .connection-name{
    flex-1;
    text-overflow:ellipsis;
    white-space:noWrap;
    overflow:hidden;
    }
    .connection-type{
    opacity:.6;
    }
`;
 const ConnectionComponentSubSectionDiv = styled.div``;
export {
  ConnectionComponentSubSectionDiv,
  ConnectionComponentMainDiv,
  ConnectionComponentHeaderDiv

}
