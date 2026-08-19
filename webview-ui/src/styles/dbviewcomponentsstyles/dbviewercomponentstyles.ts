import styled from "styled-components";

const DBViewerComponentMianDiv = styled.div``;

const DBViewerComponentHeaderDiv = styled.div`
padding:8px 10px;
  > div {
    display: flex;
    align-items: end;
    justify-content: space-between;
  }
  .left-items {
    display: flex;
    gap: 4px;
  }
  .db-viewer-action-button {
    display: flex;
    align-iems: center;
    height: 28px;
  }
`;

const DBViewerComponentBodyDiv = styled.div``;

export {
  DBViewerComponentMianDiv,
  DBViewerComponentHeaderDiv,
  DBViewerComponentBodyDiv,
};
