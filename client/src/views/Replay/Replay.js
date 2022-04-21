import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Slider, Switch } from 'antd';
import './Replay.less';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar/NavBar';
import { Table } from 'antd';
import { getSave, getSession } from '../../Utils/requests';

const Replay = () => {
  const { saveID } = useParams();
  const workspaceRef = useRef(null);
  const [replay, setReplay] = useState([]);
  const [blocksData, setBlocksData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRef, setPlaybackRef] = useState(null);
  const [playSpeed, setPlaySpeed] = useState(500);
  const navigate = useNavigate();
  const [action, setAction] = useState('');
  const [student, setStudent] = useState('');
  const [className, setClassName] = useState('');
  const [lesson, setLesson] = useState('');
  const [session, setSession] = useState('');
  const [isToggle, setIsToggle] = useState(true);

  const reducer = (state, action) => {
    switch (action.type) {
      case 'Increment':
        return state + 1;
      case 'Decrement':
        return state - 1;
      case 'SetValue':
        return action.value;
      default:
        return state;
    }
  };

  const [step, dispatch] = useReducer(reducer, 0);

  const setWorkspace = () => {
    workspaceRef.current = window.Blockly.inject('blockly-canvas', {
      toolbox: document.getElementById('toolbox'),
      readOnly: true,
    });
  };

  const formatMyDate = (timestamp, locale = 'en-GB') => {
    return new Date(timestamp).toLocaleTimeString(locale);
  };

  useEffect(() => {
    // const getReplay = async () => {
    //   const save = await getSave(saveID);
    //   console.log(save.data.replay);
    //   setReplay(save.data.replay);
    // };
    // getReplay();


    const getData = async () => {
      const session = await getSession(saveID);
      setSession(session.data);
      console.log(session.data);

      const fetchedStudents = session.data.students[0].name;
      setStudent(fetchedStudents);

      const fetchedClassroomNames = session.data.classroom.name;
      setClassName(fetchedClassroomNames);

      const fetchedLesson = session.data.learning_standard.name;
      setLesson(fetchedLesson);

      if (session.data.saves?.length) {
        const latestSave = session.data.saves[session.data.saves.length - 1];
        const save = await getSave(latestSave.id);
        // console.log(save.data.replay);
        setReplay(save.data.replay);
      }
    };
    getData();
  }, []);

  // const dataSource = [
  //   {
  //     key: timestamp,
  //     name: blockName,
  //     action: action,
  //   }
  // ];

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '3%',
      align: 'center',
      sorter: {
        compare: (a, b) => (a.last_logged_in < b.last_logged_in ? -1 : 1),
      },
    },
    {
      title: 'Blocks',
      dataIndex: 'blockName',
      key: 'blockName',
      width: '3%',
      align: 'center',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: '3%',
      align: 'center',
    },
  ];

  const goBack = () => {
    dispatch({ type: 'Decrement' });
  };

  const goForward = () => {
    dispatch({ type: 'Increment' });
  };

  const setStep = (value) => {
    dispatch({ type: 'SetValue', value: value });
  };

  const handlePlay = () => {
    setPlaybackRef(
      setInterval(() => {
        goForward();
      }, playSpeed)
    );

    setIsPlaying(true);
  };

  const handlePause = useCallback(() => {
    if (playbackRef) {
      clearInterval(playbackRef);
      setPlaybackRef(null);
    }
    setIsPlaying(false);
  }, [playbackRef]);

  function onChange(checked) {
    console.log(`switch to ${checked}`);
    setIsToggle(checked);
  }

  //handle dynamic playback changes
  useEffect(() => {
    if (replay.length) {
      if (step === replay.length - 1 && isPlaying) handlePause();

      workspaceRef.current ? workspaceRef.current.clear() : setWorkspace();
      const xml = window.Blockly.Xml.textToDom(replay[step].xml);
      window.Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
      setAction(replay[step].action);
    }
  }, [replay, step, isPlaying, handlePause]);

  const changePlaySpeed = (value) => {
    setPlaySpeed(value);
  };

  const handleGoBack = () => {
    if (window.confirm('Comfirm going back')) navigate(-1);
  };

  return (
    <main className='container nav-padding'>
      <NavBar />
      <div id='horizontal-container' className='flex flex-column'>
        <div id='top-container' className='flex flex-column vertical-container'>
          <div className='flex' id='toggle'>
            <Switch defaultChecked checkedChildren='Show' unCheckedChildren='Hide' onChange={onChange} />
          </div>
          <div className='flex flex-column' id='replay-heading'>
            <h1>{className}</h1>
            <h2>{lesson}</h2>
            <h2 className={isToggle ? 'show-name' : 'hide-name'}>{student}</h2>
          </div>
          <div
            id='description-container'
            className='flex flex-row space-between card'
          >
            <div className='flex flex-row'>
              <button
                onClick={handleGoBack}
                id='link'
              >
                <i id='icon-btn' className='fa fa-arrow-left' />
              </button>
            </div>
            <div className='flex flex-row'>
              <div className='flex flex-row' id='slider'>
                &#128034;
                <Slider
                  className='playspeed-slider'
                  defaultValue={playSpeed}
                  max={1000}
                  min={50}
                  step={50}
                  onAfterChange={changePlaySpeed}
                  disabled={isPlaying}
                  reverse={true}
                />
                &#128007;
              </div>
              <button
                className='replayButton'
                onClick={goBack}
                disabled={step === 0}
              >
                &#9198;
              </button>
              <button
                className='replayButton'
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={step === replay.length - 1}
              >
                {isPlaying ? (
                  <span>&#9208;</span>
                ) : (
                  <span>&#9654;&#65039;</span>
                )}
              </button>
              <button
                className='replayButton'
                onClick={goForward}
                disabled={step === replay.length - 1}
              >
                &#9197;
              </button>
            </div>
          </div>
          <div id='timeline-container'>
            <div id='timeline'>
              {replay.map((item, index) => (
                <div
                  className={step === index ? 'current-time' : 'all-times'}
                  key={item.timestamp}
                  onClick={() => setStep(index)}
                >
                  {formatMyDate(item.timestamp)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex flex-row'>
          <div
            id='bottom-container'
            className='flex flex-column vertical-container overflow-visible'
          >
            <h1 id='section-header'>Code Replay</h1>
            <div id='blockly-canvas'>
              <h2 id='action'>{`Action: ${action}`}</h2>
            </div>
            {/* <div id="timeline">
              { replay.map((item, index) => <div className={step === index ? 'current-time' : 'all-times'} key={item.timestamp}>{timeConverter(item.timestamp)}<Marker/></div>)}
            </div> */}
          </div>
        </div>
        <div className='flex flex-row'>
          <section
            id='bottom-container'
            className='flex flex-column vertical-container overflow-visible'
          >
            <h2 id='logs-title'>Logs</h2>
            {/* <div id='logs'>
              { replay.map((item, index) => <p className={step === index ? 'bold' : null} key={item.timestamp}> {timeConverter(item.timestamp)} </p>)}
            </div> */}
            <Table
              columns={columns}
              // dataSource={dataSource}
            />
          </section>
        </div>
      </div>
      <xml id='toolbox' is='Blockly workspace'></xml>
    </main>
  );
};

export default Replay;
