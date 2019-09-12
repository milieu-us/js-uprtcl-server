import request from "supertest";
import promiseRequest from "request-promise";
import { router } from '../../server';
import CID from 'cids';
import { Perspective, DataDto, DataType } from "./types";

jest.mock("request-promise");
(promiseRequest as any).mockImplementation(() => '{"features": []}');

interface ExtendedMatchers extends jest.Matchers<void> {
  toBeValidCid: () => object;
}

const createPerspective = async (creatorId: string, name: string, context: string, timestamp: number):Promise<string> => {
  
  const perspective: Perspective = {
    id: '',
    name: name,
    context: context,
    origin: '',
    creatorId: creatorId,
    timestamp: timestamp
  }

  const post = await request(router).post('/uprtcl/1/persp')
  .send(perspective);
  expect(post.status).toEqual(200);
  (expect(post.text) as unknown as ExtendedMatchers).toBeValidCid();

  return post.text;
}

const getPerspective = async (perspectiveId: string):Promise<Perspective> => {
  const get = await request(router).get(`/uprtcl/1/persp/${perspectiveId}`);
  expect(get.status).toEqual(200);
  
  return JSON.parse(get.text);
}

const createText = async (text: string):Promise<string> => {
  const data = {
    id: '',
    text: text
  }

  const dataDto: DataDto = {
    id: '',
    data:  data,
    type: DataType.TEXT
  }

  const post = await request(router).post('/uprtcl/1/data')
  .send(dataDto);
  expect(post.status).toEqual(200);
  (expect(post.text) as unknown as ExtendedMatchers).toBeValidCid();

  return post.text;
}

const createTextNode = async (text: string, links: string[]):Promise<string> => {
  const data = {
    id: '',
    text: text,
    links: links
  }

  const dataDto: DataDto = {
    id: '',
    data:  data,
    type: DataType.TEXT_NODE
  }

  const post = await request(router).post('/uprtcl/1/data')
  .send(dataDto);
  expect(post.status).toEqual(200);
  (expect(post.text) as unknown as ExtendedMatchers).toBeValidCid();

  return post.text;
}

const getData = async (dataId: string):Promise<any> => {
  const get = await request(router).get(`/uprtcl/1/data/${dataId}`);
  expect(get.status).toEqual(200);
  return JSON.parse(get.text);
}

describe("routes", () => {

  expect.extend({
    toBeValidCid(received) {
      if (CID.isCID(new CID(received))) {
        return {
          message: () => {return `expected ${received} not to be a valid cid`},
          pass: true
        };
      } else {
        return {
          message: () => {return `expected ${received} to be a valid cid`},
          pass: false
        };
      }
    }
  })

  test.skip("CRUD perspectives", async () => {
    const creatorId = 'did:method:12345';
    const name = 'test';
    const context = 'wikipedia.barack_obama';
    const timestamp = 1568027451547;

    let perspectiveId = await createPerspective(creatorId, name, context, timestamp);
    let perspectiveRead = await getPerspective(perspectiveId);
    
    const origin = 'http://collectiveone.org/uprtcl/1';

    expect(perspectiveRead.id).toEqual(perspectiveId);
    expect(perspectiveRead.creatorId).toEqual(creatorId);
    expect(perspectiveRead.timestamp).toEqual(timestamp);
    expect(perspectiveRead.name).toEqual(name);
    expect(perspectiveRead.context).toEqual(context);
    expect(perspectiveRead.origin).toEqual(origin);
  });

  test.skip("CRUD text data", async () => {
    let text = 'an example text';

    let dataId = await createText(text);
    let dataRead = await getData(dataId)
    
    expect(dataRead.id).toEqual(dataId);
    expect(dataRead.text).toEqual(text);
  });

  test("CRUD text node data", async () => {
    let text1 = 'a paragraph 1';
    let par1Id = await createText(text1);

    let text2 = 'a paragraph 2';
    let par2Id = await createText(text2);

    let text3 = 'a title';
    let links = [par1Id, par2Id];
    let dataId = await createTextNode(text3, links);

    let dataRead = await getData(dataId)
    
    expect(dataRead.id).toEqual(dataId);
    expect(dataRead.text).toEqual(text3);
    expect(dataRead.links.length).toEqual(2);
    expect(dataRead.links[0]).toEqual(par1Id);
    expect(dataRead.links[1]).toEqual(par2Id);
  });
  
});