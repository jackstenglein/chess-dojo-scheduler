use std::fmt;

use arrayvec::ArrayString;
use serde::{de, Deserialize};
use serde_with::{serde_as, DisplayFromStr};
use shakmaty::{
    fen::Fen, uci::Uci, Setup, Square,
};

use crate::assets::{BoardTheme, PieceSet};

#[derive(Deserialize, Debug, Default, PartialEq, Eq, Copy, Clone)]
pub enum Orientation {
    #[serde(rename = "white")]
    #[default]
    White,
    #[serde(rename = "black")]
    Black,
}

impl Orientation {
    pub fn fold<T>(self, white: T, black: T) -> T {
        match self {
            Orientation::White => white,
            Orientation::Black => black,
        }
    }

    pub fn x(self, square: Square) -> usize {
        self.fold(usize::from(square.file()), 7 - usize::from(square.file()))
    }

    pub fn y(self, square: Square) -> usize {
        self.fold(7 - usize::from(square.rank()), usize::from(square.rank()))
    }
}

pub type PlayerName = ArrayString<100>; // length limited to prevent dos

pub type Date = ArrayString<10>;

pub type Comment = ArrayString<255>; // strict length limit for gif comments

#[derive(Debug, Default, Copy, Clone)]
pub enum CheckSquare {
    #[default]
    No,
    Yes,
    Square(Square),
}

impl<'de> Deserialize<'de> for CheckSquare {
    fn deserialize<D>(deseralizer: D) -> Result<CheckSquare, D::Error>
    where
        D: de::Deserializer<'de>,
    {
        struct CheckSquareVisitor;

        impl<'de> de::Visitor<'de> for CheckSquareVisitor {
            type Value = CheckSquare;

            fn expecting(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
                fmt.write_str("square name or bool")
            }

            fn visit_str<E>(self, name: &str) -> Result<CheckSquare, E>
            where
                E: de::Error,
            {
                if name == "1" || name == "yes" || name == "true" {
                    Ok(CheckSquare::Yes)
                } else if name == "0" || name == "no" || name == "false" {
                    Ok(CheckSquare::No)
                } else {
                    match name.parse() {
                        Ok(sq) => Ok(CheckSquare::Square(sq)),
                        Err(_) => Err(de::Error::custom("invalid square name")),
                    }
                }
            }

            fn visit_bool<E>(self, yes: bool) -> Result<CheckSquare, E>
            where
                E: de::Error,
            {
                Ok(match yes {
                    true => CheckSquare::Yes,
                    false => CheckSquare::No,
                })
            }
        }

        deseralizer.deserialize_any(CheckSquareVisitor)
    }
}

#[derive(Debug, Default, Copy, Clone, PartialEq, Eq)]
pub enum Coordinates {
    No,
    #[default]
    Yes,
}

impl<'de> Deserialize<'de> for Coordinates {
    fn deserialize<D>(deseralizer: D) -> Result<Coordinates, D::Error>
    where
        D: de::Deserializer<'de>,
    {
        struct CoordinatesVisitor;

        impl<'de> de::Visitor<'de> for CoordinatesVisitor {
            type Value = Coordinates;

            fn expecting(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
                fmt.write_str("\"1\", \"yes\", \"true\", \"0\", \"no\", \"false\" or bool")
            }

            fn visit_str<E>(self, name: &str) -> Result<Coordinates, E>
            where
                E: de::Error,
            {
                if name == "1" || name == "yes" || name == "true" {
                    Ok(Coordinates::Yes)
                } else if name == "0" || name == "no" || name == "false" {
                    Ok(Coordinates::No)
                } else {
                    Err(de::Error::custom("invalid coordinates value"))
                }
            }

            fn visit_bool<E>(self, yes: bool) -> Result<Coordinates, E>
            where
                E: de::Error,
            {
                Ok(match yes {
                    true => Coordinates::Yes,
                    false => Coordinates::No,
                })
            }
        }

        deseralizer.deserialize_any(CoordinatesVisitor)
    }
}

impl CheckSquare {
    pub fn to_square(self, setup: &Setup) -> Option<Square> {
        match self {
            CheckSquare::No => None,
            CheckSquare::Yes => setup.board.king_of(setup.turn),
            CheckSquare::Square(sq) => Some(sq),
        }
    }
}

#[serde_as]
#[derive(Deserialize, Debug)]
pub struct RequestParams {
    pub white: Option<PlayerName>,
    pub black: Option<PlayerName>,
    pub date: Option<Date>,
    pub comment: Option<Comment>,
    #[serde_as(as = "DisplayFromStr")]
    #[serde(default)]
    pub fen: Fen,
    #[serde_as(as = "Option<DisplayFromStr>")]
    #[serde(default, rename = "lastMove")]
    pub last_move: Option<Uci>,
    #[serde(default)]
    pub check: CheckSquare,
    #[serde(default)]
    pub orientation: Orientation,
    #[serde(default)]
    pub theme: BoardTheme,
    #[serde(default)]
    pub piece: PieceSet,
    #[serde(default)]
    pub coordinates: Coordinates,
}

#[derive(Deserialize)]
pub struct RequestBody {
    pub white: Option<PlayerName>,
    pub black: Option<PlayerName>,
    pub date: Option<Date>,
    pub comment: Option<Comment>,
    pub frames: Vec<RequestFrame>,
    #[serde(default)]
    pub orientation: Orientation,
    #[serde(default)]
    pub delay: u16,
    #[serde(default)]
    pub theme: BoardTheme,
    #[serde(default)]
    pub piece: PieceSet,
    #[serde(default)]
    pub coordinates: Coordinates,
}

#[serde_as]
#[derive(Deserialize, Default)]
pub struct RequestFrame {
    #[serde_as(as = "DisplayFromStr")]
    #[serde(default)]
    pub fen: Fen,
    #[serde(default)]
    pub delay: Option<u16>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    #[serde(default, rename = "lastMove")]
    pub last_move: Option<Uci>,
    #[serde(default)]
    pub check: CheckSquare,
}
